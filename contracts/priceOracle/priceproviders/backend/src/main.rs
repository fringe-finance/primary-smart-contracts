#![allow(non_snake_case)]
#![allow(unused_imports)]

extern crate chrono;

use chrono::{Duration, Utc};
use web3::types::{U256,Address};
use web3::signing::{keccak256, Key};
use secp256k1::SecretKey;

pub fn pack(token_address: Address, price_mantissa: U256, price_decimals: u8, valid_to: U256) -> Vec<u8> {
    let token_address_bytes = token_address.as_bytes();

    let price_mantissa_bytes = {
        let mut message = [0u8; 32];
        price_mantissa.to_big_endian(&mut message[..]);
    
        message
    };

    let price_decimals_bytes = price_decimals.to_be_bytes();

    let valid_to_bytes = {
        let mut message = [0u8; 32];
        valid_to.to_big_endian(&mut message[..]);
    
        message
    };

    let mut message: Vec<u8> = Vec::new();
    message.extend(&token_address_bytes[..]);
    message.extend(&price_mantissa_bytes[..]);
    message.extend(&price_decimals_bytes[..]);
    message.extend(&valid_to_bytes[..]);

    message
}

pub fn sign_message(secret_key: &SecretKey, message: &[u8]) -> String {
    let messageHash: [u8; 32] = keccak256(message);
    println!("message hash: {:?}",hex::encode(&messageHash));
    let ethSignedMessage = {
        let mut hash: Vec<u8> = Vec::new();
        hash.extend_from_slice(b"\x19Ethereum Signed Message:\n32");
        hash.extend_from_slice(&messageHash);
        hash
    };
    println!("ethSignedMessage hex: {:?}",hex::encode(&ethSignedMessage));
    let ethSignedMessageHash = keccak256(&ethSignedMessage);
    println!("ethSignedMessageHash: {:?}", ethSignedMessageHash);
    println!("ethSignedMessageHash hex: {:?}", hex::encode(ethSignedMessageHash));
    let signature = secret_key.sign(&ethSignedMessageHash,None).unwrap();
    let r: [u8; 32] = signature.r.0;
    let s: [u8; 32] = signature.s.0;
    let v: [u8; 1] = [(signature.v as u8)];
    format!("0x{}{}{}", hex::encode(r), hex::encode(s), hex::encode(v))
}

fn main() {
    let tokenAddress : Vec<u8> = hex::decode("C04d245263fF5459CeA78C1800fdc69BD11B4b59").unwrap();
    let token_address : Address = Address::from_slice(&tokenAddress);
    let priceMantissa = "1100000"; //price = 1.1 USD/PRJ
    let price_mantissa: U256 = U256::from_dec_str(&priceMantissa).unwrap(); 
    let price_decimals: u8 = 6;
    let validTo: String = (Utc::now() + Duration::minutes(5)).timestamp().to_string();
    let valid_to: U256 = U256::from_dec_str(&validTo).unwrap(); 

    println!("tokenAddress: {:?}", token_address);
    println!("priceMantissa: {:?}", price_mantissa);
    println!("priceDecimals: {:?}", price_decimals);
    println!("validTo: {:?}", valid_to);

    let message: Vec<u8> = pack(token_address, price_mantissa, price_decimals, valid_to);

    println!("message len: {:?}", message.len());
    println!("message {:?}", message);
    println!("message hex: {:?}",hex::encode(&message));
    
    let private_key = "1dd9ab7163ccf43b3f2d7cf76d932f11d59aec016da760a4b6a6247a522ad049";
    let private_key_vector = hex::decode(private_key).unwrap();
    println!("private_key_vector: {:?}",private_key_vector);
    let secret_key = SecretKey::from_slice(&private_key_vector).expect("Should correct private key");
    println!("Secret key: {:?}", secret_key);

    
    let sign = sign_message(&secret_key, &message);
    println!("Sign: {:?}", sign);


}