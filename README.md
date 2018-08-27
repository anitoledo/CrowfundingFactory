# Crowdfunding Factory

Crowdfunding Factory is a crowdfunding platform that allows users to invest on projects of their liking with a promise of
getting a profit within a stated deadline.<br>
Campaigns creators choose a deadline, rate, term and a funding goal. <br>
If the goal is not met by the deadline, the investors get their money back.<br>
If the goal is met, the beneficiary gets the money and compromises to pay a debt (which will be the amount gathered plus the stated rate)
within a deadline (wich will be the the date when the goal was reached plus the months stated as term). 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need node.js installed, which you can get [here](https://nodejs.org/es/). Then install the following packages:

```
npm install -g ganache-cli
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

You need ganache client running:

```
ganache-cli
```

And ipfs server:

```
ipfs daemon
```

Lastly for running the application:

```
npm migrate
npm run dev
```

## Running the tests

```
npm test
```

## Acknowledgments

I would like to thank Consensys for the support and guidance throughout this project.
