use keyring::Entry;
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

const API_BASE: &str = "https://hooks.cool";
const KEYCHAIN_SERVICE: &str = "cool.hooks.threethings.session";
const KEYCHAIN_ACCOUNT: &str = "hooks.cool";

#[derive(Debug, Deserialize, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: Value,
}

fn keychain() -> Result<Entry, String> {
    Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT).map_err(|_| "keychain_unavailable".into())
}

fn saved_token() -> Result<String, String> {
    keychain()?.get_password().map_err(|error| match error {
        keyring::Error::NoEntry => "not_authenticated".into(),
        _ => "keychain_unavailable".into(),
    })
}

fn save_token(token: &str) -> Result<(), String> {
    keychain()?
        .set_password(token)
        .map_err(|_| "keychain_unavailable".into())
}

fn remove_token() {
    if let Ok(entry) = keychain() {
        let _ = entry.delete_credential();
    }
}

fn client() -> Result<Client, String> {
    Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|_| "network_error".into())
}

#[tauri::command]
fn native_open_auth(url: String) -> Result<(), String> {
    let google = "https://hooks.cool/api/auth/google?product=3things&client=desktop&clientState=";
    let email = "https://hooks.cool/login/?product=3things&client=desktop&clientState=";
    if url.len() > 1024 || (!url.starts_with(google) && !url.starts_with(email)) {
        return Err("invalid_auth_url".into());
    }
    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|_| "browser_unavailable".into())
}

async fn response_json<T: for<'de> Deserialize<'de>>(
    response: reqwest::Response,
) -> Result<T, String> {
    if response.status() == StatusCode::UNAUTHORIZED {
        return Err("not_authenticated".into());
    }
    if response.status() == StatusCode::CONFLICT {
        return Err("revision_conflict".into());
    }
    if !response.status().is_success() {
        return Err("server_unavailable".into());
    }
    response
        .json::<T>()
        .await
        .map_err(|_| "invalid_server_response".into())
}

#[tauri::command]
async fn native_exchange_code(code: String) -> Result<Value, String> {
    if code.len() < 20 || code.len() > 256 || !code.is_ascii() {
        return Err("invalid_code".into());
    }
    let response = client()?
        .post(format!("{API_BASE}/api/auth/app/exchange"))
        .json(&json!({ "code": code }))
        .send()
        .await
        .map_err(|_| "network_error")?;
    let auth: AuthResponse = response_json(response).await?;
    save_token(&auth.token)?;
    Ok(json!({ "user": auth.user }))
}

#[tauri::command]
async fn native_session() -> Result<Value, String> {
    let token = saved_token()?;
    let response = client()?
        .get(format!("{API_BASE}/api/auth/app/session"))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|_| "network_error")?;
    response_json(response).await
}

#[tauri::command]
async fn native_sync_get() -> Result<Value, String> {
    let token = saved_token()?;
    let response = client()?
        .get(format!("{API_BASE}/api/3things/sync"))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|_| "network_error")?;
    response_json(response).await
}

#[tauri::command]
async fn native_sync_put(data: Value, revision: Option<i64>) -> Result<Value, String> {
    let token = saved_token()?;
    let response = client()?
        .put(format!("{API_BASE}/api/3things/sync"))
        .bearer_auth(token)
        .json(&json!({ "data": data, "revision": revision }))
        .send()
        .await
        .map_err(|_| "network_error")?;
    response_json(response).await
}

#[tauri::command]
async fn native_logout() -> Result<(), String> {
    let token = saved_token()?;
    let result = client()?
        .post(format!("{API_BASE}/api/auth/app/logout"))
        .bearer_auth(token)
        .send()
        .await;
    remove_token();
    match result {
        Ok(response) if response.status().is_success() => Ok(()),
        Ok(_) => Err("server_unavailable".into()),
        Err(_) => Err("offline_logout".into()),
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![
            native_open_auth,
            native_exchange_code,
            native_session,
            native_sync_get,
            native_sync_put,
            native_logout
        ])
        .run(tauri::generate_context!())
        .expect("error while running 3things");
}
