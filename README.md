# Crowdfunding Factory

Crowdfunding Factory is a crowdfunding platform that allows users to invest on projects of their liking with a promise of
getting a profit within a stated deadline.<br>
Campaigns creators choose a deadline, rate, term and a funding goal. <br>
If the goal is not met by the deadline, the investors get their money back.<br>
If the goal is met, the beneficiary gets the money and compromises to pay a debt (which will be the amount gathered plus the stated rate)
within a deadline (wich will be the the date when the goal was reached plus the months stated as term). 

To know how the workflow of the dApp works, read the [dApp tutorial](https://github.com/anitoledo/CrowfundingFactory/blob/master/tutorial.md).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

To interact with the app in a browser you will need to install [Metamask](https://metamask.io/) in your browser.

You will need node.js installed, which you can get [here](https://nodejs.org/es/). Then install the following packages:

```
npm install -g ganache-cli
npm install -g truffle
```

The project uploads images to ipfs. Follow the [IPFS install guide](https://ipfs.io/docs/install/) for your operating 
system and then do the following:

```
ipfs init
ipfs daemon
```

Lastly configure IPFS to allow CORS. Stop the ipfs (ctrl-c) and do the following:

```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST", "OPTIONS"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"*\"]"
```

### Installing

Firstly you need ganache client running:

```
ganache-cli
```

And ipfs server:

```
ipfs daemon
```

Then for running the application:

```
truffle migrate
npm run dev
```

And lastly to configure Metamask:

1. Check that the chosen network is Localhost 8545
2. Select the option "Import using account seed phrase"
3. Use the mnemonic phrase your ganache client gave you when running.
4. Set your password.
5. Interact with the dApp!

## Running the tests

```
truffle test
```

## Acknowledgments

I would like to thank Consensys for the support and guidance throughout this project.
