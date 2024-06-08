const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    AccountBalanceQuery,
    Hbar,
    TransferTransaction,
} = require("@hashgraph/sdk");
const {
    HEDERA_CREDENTIALS_NOT_FOUND,
    default_maximum_transaction_fee,
    maximum_payment_for_queries,
    account_creation_initial_balance,
} = require("./constants");
require("dotenv").config();

async function environmentSetup() {
    //Grab your Hedera testnet account ID and private key from your .env file
    const { HEDERA_PRIVATE_KEY, HEDERA_ACCOUNT_ID } = process.env;

    // If we weren't able to grab it, we should throw a new error
    if (!HEDERA_PRIVATE_KEY || !HEDERA_ACCOUNT_ID) {
        throw new Error(HEDERA_CREDENTIALS_NOT_FOUND);
    }

    //Create your Hedera Testnet client
    const client = Client.forTestnet();

    //Set your account as the client's operator
    client.setOperator(HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY);

    //Set the default maximum transaction fee (in Hbar)
    client.setDefaultMaxTransactionFee(
        new Hbar(default_maximum_transaction_fee)
    );

    client.setDefaultMaxQueryPayment(new Hbar(maximum_payment_for_queries));

    const accountPrivateKey = PrivateKey.generateED25519();
    const accountPublicKey = accountPrivateKey.publicKey;

    const newAccount = await new AccountCreateTransaction()
        .setKey(accountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(account_creation_initial_balance))
        .execute(client);

    const receipt = await newAccount.getReceipt(client);
    const newAccountId = receipt.accountId;

    // console.log(`Returned account id => ${accountId}`);

    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(HEDERA_ACCOUNT_ID)
        .execute(client);

    console.log(
        `Returned account balance => ${accountBalance.hbars.toTinybars()}`
    );

    const sendHbar = await new TransferTransaction()
        .addHbarTransfer(HEDERA_ACCOUNT_ID, Hbar.fromTinybars(-1000))
        .addHbarTransfer(newAccountId, Hbar.fromTinybars(1000))
        .execute(client);

    const sentHbarReceipt = await sendHbar.getReceipt(client);
    console.log(sentHbarReceipt.status.toString());

    //query ledger data

    //get the cost of query
    const queryCost = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .getCost(client);

    console.log(`Query cost => ${queryCost}`);

    const getNewAccountAccountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log(
        `Account balance of the new account => ${getNewAccountAccountBalance.hbars.toTinybars()}`
    );
}
environmentSetup();
