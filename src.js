var alice = new Client('alice');
var bob = new Client('bob');
var carl = new Client('carl');
var clients = [alice, bob, carl];

/*
 * DO NOT EDIT
 */
function Client (id) {
  this.id = id; // id == public key == address
  this.unusedValidTransactions = {}; // blockchain pertaining to thisClient, with key = transaction id and value = transaction
  this.unvalidatedTransactions = []; // need to validate these.
};

/*
 * PLEASE EDIT
 * params: clientId, amount
 * returns: Transaction
 * behavior: constructs a Transaction giving the amount to the clientId and the rest of the balance back to this client.
 */

Client.prototype.give = function(clientId, amount) {

  var thisClient = this;
  var txn = new Transaction (thisClient);

  var txnArr = arrayify ( thisClient.unusedValidTransactions );
  txnArr.forEach ( function ( unusedTxn ) {
    unusedTxn.outputs.forEach ( function ( txnOutput ) {
      if (txnOutput.destination == thisClient.id) {          
        txn.addInput ( unusedTxn ); 
      }
    });
  });

  txn.addOutput ( clientId, amount );
  txn.addOutput ( thisClient.id, thisClient.balance() - amount );
  thisClient.broadcastTransaction ( txn );

  return txn;
  // helper (DO NOT EDIT)
  function arrayify(obj){
    return Object.keys(obj).reduce(function(result, key){
      result.push(obj[key]);
      return result;
    }, []);
  }
};
/*
 * PLEASE EDIT
 * params: Transaction
 * returns: null
 * behavior: invokes onReceivingTransaction for each client in the global list of clients. i.e. tells everyone that I am making a transaction.
 */
Client.prototype.broadcastTransaction = function(transaction){
  var i, len, thisClient;
  thisClient = this;
  i = 0;
  len = clients.length;
  for ( i; i < len; i++ ) {
    clients[i].onReceivingTransaction ( transaction, thisClient.id );
  }
};
/*
 * PLEASE EDIT
 * dependencies: Client.prototype.verify
 * params: Transaction, String
 * returns: null
 * behavior: if the transaction is valid, adds it to unvalidatedTransactions.
 */
Client.prototype.onReceivingTransaction = function(transaction, senderId){

};
/*
 * PLEASE EDIT
 * dependencies: Client.prototype.validateSolution
 * params: null
 * returns: Number
 * behavior: generates a solution to the proof-of-work problem (for which client.verify returns true) and broadcasts it along with unvalidated transactions to all clients.
 */
Client.prototype.mine = function(){

  return solution;
};
/*
 * PLEASE EDIT
 * params: Number, Transaction
 * returns: null
 * behavior: broadcasts solution, a copy of unvalidatedTransactions, and thisClient's id to all clients.
 */
Client.prototype.broadcastSolution = function(solution, transactions){
  var i, len;
  i = 0;
  len = clients.length;
  for ( i; i < len; i++ ) {
    clients[i].onReceivingSolution ( solution, transactions, len[i].id );
  }
};
/*
 * PLEASE EDIT
 * params: Number, Transaction, String
 * returns: null
 * behavior: if solution and transactions are valid, generates a reward for the solver then invokes updateBlockchain.
 */
Client.prototype.onReceivingSolution = function(solution, transactions, solverId){

  if ( verifyAll (transactions) ) {
    //generate reward
    //solution
    updateBlochchain ( transactions ); 
  }
  // helpers (DO NOT EDIT)
  function verifyAll(transactions){
    return transactions.reduce(function(transactionsValid, transaction){
      return transactionsValid && thisClient.verify(transaction);
    }, true);
  }

  function updateBlockchain(transactions){
    transactions.forEach(function(transaction){
      deleteUsedInputTransactions(transaction) // todo other dest?
      thisClient.unusedValidTransactions[transaction.id] = transaction;
      // clear txn from unvalidatedTransactions
      var i = thisClient.unvalidatedTransactions.indexOf(transaction);
      if(i >= 0){
        thisClient.unvalidatedTransactions.splice(i, 1);
      }
    });

    function deleteUsedInputTransactions(transaction){
      transaction.inputs.forEach(function(inputTransaction){
        delete thisClient.unusedValidTransactions[inputTransaction.id];
      });
    }
  }
};
/*
 * PLEASE EDIT
 * params: null
 * returns: Number
 * behavior: iterates through unusedValidTransactions, summing the amounts transactions sent to thisClient. key = transaction id/ value = transaction
 */
Client.prototype.balance = function(){
  var thisClient = this;
  return Object.keys ( thisClient.unusedValidTransactions ).reduce ( function ( sum, txnid ) {
      return sum += thisClient.unusedValidTransactions[txnid].sumToDestination (thisClient.id);
    }, 0 )
};
/*
 * PLEASE EDIT
 * params: Transaction
 * returns: Boolean
 * behavior: determines if Transaction's inputs and outputs are valid.
 */
Client.prototype.verify = function(transaction){
  // each input must be valid, unused, and name the sender as a destination

  return isTransactionValid;
};
/*
 * DO NOT EDIT
 */
Client.prototype.validateSolution = function(solution){
  return solution < 0.2;
  //
};
/*
 * DO NOT EDIT
 */
Client.prototype.generateRewardTransaction = function(solution, id, amount){
  var txn = new Transaction('coinbase', 'reward'+solution); // same SHA for a given solution
  txn.addOutput(id, amount);
  return txn;
};

/*
 * DO NOT EDIT any of the Transaction methods.
 */

//Inputs are an array of Transactions
//Outputs are unverified transactions
function Transaction(sender){
  this.sender = sender;
  this.id = 'transfer'+Math.random();
  this.inputs = [];
  this.outputs = [];
}

// input = the blockchain
Transaction.prototype.addInput = function(inputTransaction){ //should be valid and unused
  this.inputs.push(inputTransaction);
  //
};

// output = what you want to do with the money you have
Transaction.prototype.addOutput = function(publicKey, amount){
  this.outputs.push({amount:amount, destination:publicKey}); // destination can be thisClient
  //
};

// txn verification helper functions

/* outputsValid checks if the client isn't trying to put out more money 
 * than he has by calling inputsSumToSender
 */
Transaction.prototype.outputsValid = function(){
  var outputsSum = this.outputs.reduce(function(sum, output){
    return sum += output.amount;
  }, 0);
  //
  return this.inputsSumToSender(this.sender.id) - outputsSum >= 0;
  // todo make === not >= ; difference would be fee to miner
};

//
Transaction.prototype.inputsValid = function(unusedValidTransactions){
  var sender = this.sender;
  // for each input
  return this.inputs.reduce(function(isValid, inputTransaction){
    return isValid
      // isValid is just the "base"
      // input transaction is valid and hasn't been used to source another txn yet
      && unusedValidTransactions[inputTransaction.id]
      // input transactions sent > 0 coins to sender
      && inputTransaction.sumToDestination(sender.id) > 0;
  }, true);
};

// For every single input, sum up their outputs, basically verifying
// every transaction ever
// for every single input, sum up the result of sumToDestination(clientId)
// Input = [txns]; Output = [{id: id, amount: amount}] 
// sumToDestination sums up amounts where output.destination === clientId
// Bascially nested loop
Transaction.prototype.inputsSumToSender = function(clientId){
  return this.inputs.reduce( function(sum, inputTransaction){
    return sum += inputTransaction.sumToDestination(clientId);
  }, 0);
};

//for every output, if the destination is the clientId, add to the total
Transaction.prototype.sumToDestination = function(clientId){
  return this.outputs.reduce( function(sum, output) {
    return sum += output.destination === clientId ? output.amount : 0;
  }, 0 );
};

// var initialTxn = alice.generateRewardTransaction(0, 'alice', 10); // how does this really happen?
// alice.unusedValidTransactions[initialTxn.id] = initialTxn;
// bob.unusedValidTransactions[initialTxn.id] = initialTxn;
// carl.unusedValidTransactions[initialTxn.id] = initialTxn;
// console.log('alice given initial amount 10 via',initialTxn.id);

// alice.give('bob', 1);
// alice.give('carl', 2);
// alice.give('alice', 3);
// carl.mine();
