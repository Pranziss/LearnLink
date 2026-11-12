# Module 4: Cryptography Basics

Cryptography protects information by transforming it. Encryption turns readable plaintext into unreadable ciphertext using an algorithm and a key.

Symmetric encryption uses one shared key for both encrypting and decrypting, and it is fast. Asymmetric encryption uses a public and private key pair, which solves the problem of sharing keys safely.

Hashing is different from encryption because it is one-way. A hash gives data a fixed-length fingerprint, so any change to the data produces a different hash. This is how integrity is checked.

- **Plaintext**: data in its readable form before encryption
- **Ciphertext**: data after it has been encrypted and cannot be read without the key
- **Digital signature**: a value made with a private key that proves who sent a message and that it was not altered
- **Hash**: a fixed-length fingerprint of data
