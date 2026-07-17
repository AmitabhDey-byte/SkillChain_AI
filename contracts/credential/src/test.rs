extern crate std;

use super::{CredentialContract, CredentialContractClient, CredentialError, SkillLevel};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, BytesN, Env,
};

fn setup() -> (
    Env,
    CredentialContractClient<'static>,
    Address,
    Address,
    BytesN<32>,
    BytesN<32>,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger()
        .with_mut(|ledger| ledger.timestamp = 1_752_000_000);
    let contract_id = env.register(CredentialContract, ());
    let client = CredentialContractClient::new(&env, &contract_id);
    let issuer = Address::generate(&env);
    let owner = Address::generate(&env);
    let credential_id = BytesN::from_array(&env, &[7; 32]);
    let report_hash = BytesN::from_array(&env, &[9; 32]);
    client.initialize(&issuer);
    (env, client, issuer, owner, credential_id, report_hash)
}

#[test]
fn initializes_and_exposes_issuer() {
    let (_env, client, issuer, _owner, _credential_id, _report_hash) = setup();
    assert_eq!(client.issuer(), issuer);
}

#[test]
fn issues_and_verifies_credential() {
    let (_env, client, _issuer, owner, credential_id, report_hash) = setup();
    let credential = client.issue(
        &credential_id,
        &owner,
        &91,
        &SkillLevel::Expert,
        &report_hash,
    );

    assert_eq!(credential.id, credential_id);
    assert_eq!(credential.owner, owner);
    assert_eq!(credential.score, 91);
    assert_eq!(credential.level, SkillLevel::Expert);
    assert_eq!(credential.report_hash, report_hash);
    assert_eq!(credential.issued_at, 1_752_000_000);
    assert!(!credential.revoked);
    assert!(client.verify(&credential_id, &owner));
}

#[test]
fn rejects_invalid_and_duplicate_credentials() {
    let (_env, client, _issuer, owner, credential_id, report_hash) = setup();

    assert_eq!(
        client.try_issue(
            &credential_id,
            &owner,
            &101,
            &SkillLevel::Expert,
            &report_hash,
        ),
        Err(Ok(CredentialError::InvalidScore))
    );

    client.issue(
        &credential_id,
        &owner,
        &80,
        &SkillLevel::Advanced,
        &report_hash,
    );

    assert_eq!(
        client.try_issue(
            &credential_id,
            &owner,
            &80,
            &SkillLevel::Advanced,
            &report_hash,
        ),
        Err(Ok(CredentialError::CredentialExists))
    );
}

#[test]
fn revocation_invalidates_public_verification() {
    let (_env, client, _issuer, owner, credential_id, report_hash) = setup();
    client.issue(
        &credential_id,
        &owner,
        &74,
        &SkillLevel::Advanced,
        &report_hash,
    );

    let revoked = client.revoke(&credential_id);

    assert!(revoked.revoked);
    assert!(!client.verify(&credential_id, &owner));
    assert_eq!(
        client.try_revoke(&credential_id),
        Err(Ok(CredentialError::AlreadyRevoked))
    );
}

#[test]
fn verification_rejects_the_wrong_owner() {
    let (env, client, _issuer, owner, credential_id, report_hash) = setup();
    let other_owner = Address::generate(&env);
    client.issue(
        &credential_id,
        &owner,
        &65,
        &SkillLevel::Intermediate,
        &report_hash,
    );

    assert!(!client.verify(&credential_id, &other_owner));
}
