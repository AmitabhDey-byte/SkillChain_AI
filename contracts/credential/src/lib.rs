#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
};

const INSTANCE_TTL_THRESHOLD: u32 = 120_960;
const INSTANCE_TTL_EXTEND_TO: u32 = 6_307_200;
const CREDENTIAL_TTL_THRESHOLD: u32 = 120_960;
const CREDENTIAL_TTL_EXTEND_TO: u32 = 6_307_200;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SkillLevel {
    Beginner,
    Intermediate,
    Advanced,
    Expert,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Credential {
    pub id: BytesN<32>,
    pub owner: Address,
    pub score: u32,
    pub level: SkillLevel,
    pub report_hash: BytesN<32>,
    pub issued_at: u64,
    pub revoked: bool,
}

#[contractevent]
pub struct CredentialIssued {
    #[topic]
    pub owner: Address,
    #[topic]
    pub id: BytesN<32>,
    pub score: u32,
    pub level: SkillLevel,
    pub report_hash: BytesN<32>,
}

#[contractevent]
pub struct CredentialRevoked {
    #[topic]
    pub owner: Address,
    #[topic]
    pub id: BytesN<32>,
}

#[contracttype]
enum DataKey {
    Issuer,
    Credential(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum CredentialError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    CredentialExists = 3,
    CredentialNotFound = 4,
    InvalidScore = 5,
    AlreadyRevoked = 6,
}

#[contract]
pub struct CredentialContract;

#[contractimpl]
impl CredentialContract {
    pub fn initialize(env: Env, issuer: Address) -> Result<(), CredentialError> {
        if env.storage().instance().has(&DataKey::Issuer) {
            return Err(CredentialError::AlreadyInitialized);
        }

        issuer.require_auth();
        env.storage().instance().set(&DataKey::Issuer, &issuer);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn issuer(env: Env) -> Result<Address, CredentialError> {
        let issuer = get_issuer(&env)?;
        extend_instance_ttl(&env);
        Ok(issuer)
    }

    pub fn issue(
        env: Env,
        id: BytesN<32>,
        owner: Address,
        score: u32,
        level: SkillLevel,
        report_hash: BytesN<32>,
    ) -> Result<Credential, CredentialError> {
        if score > 100 {
            return Err(CredentialError::InvalidScore);
        }

        let issuer = get_issuer(&env)?;
        issuer.require_auth();
        let key = DataKey::Credential(id.clone());

        if env.storage().persistent().has(&key) {
            return Err(CredentialError::CredentialExists);
        }

        let credential = Credential {
            id: id.clone(),
            owner: owner.clone(),
            score,
            level,
            report_hash,
            issued_at: env.ledger().timestamp(),
            revoked: false,
        };

        env.storage().persistent().set(&key, &credential);
        extend_credential_ttl(&env, &key);
        extend_instance_ttl(&env);
        CredentialIssued {
            owner,
            id,
            score,
            level: credential.level.clone(),
            report_hash: credential.report_hash.clone(),
        }
        .publish(&env);
        Ok(credential)
    }

    pub fn get(env: Env, id: BytesN<32>) -> Result<Credential, CredentialError> {
        let key = DataKey::Credential(id);
        let credential = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(CredentialError::CredentialNotFound)?;

        extend_credential_ttl(&env, &key);
        Ok(credential)
    }

    pub fn verify(env: Env, id: BytesN<32>, owner: Address) -> bool {
        let key = DataKey::Credential(id);
        let credential: Option<Credential> = env.storage().persistent().get(&key);

        if credential.is_some() {
            extend_credential_ttl(&env, &key);
        }

        credential
            .map(|stored| stored.owner == owner && !stored.revoked)
            .unwrap_or(false)
    }

    pub fn revoke(env: Env, id: BytesN<32>) -> Result<Credential, CredentialError> {
        let issuer = get_issuer(&env)?;
        issuer.require_auth();
        let key = DataKey::Credential(id.clone());
        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(CredentialError::CredentialNotFound)?;

        if credential.revoked {
            return Err(CredentialError::AlreadyRevoked);
        }

        credential.revoked = true;
        env.storage().persistent().set(&key, &credential);
        extend_credential_ttl(&env, &key);
        extend_instance_ttl(&env);
        CredentialRevoked {
            owner: credential.owner.clone(),
            id,
        }
        .publish(&env);
        Ok(credential)
    }
}

fn get_issuer(env: &Env) -> Result<Address, CredentialError> {
    env.storage()
        .instance()
        .get(&DataKey::Issuer)
        .ok_or(CredentialError::NotInitialized)
}

fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
}

fn extend_credential_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, CREDENTIAL_TTL_THRESHOLD, CREDENTIAL_TTL_EXTEND_TO);
}

#[cfg(test)]
mod test;
