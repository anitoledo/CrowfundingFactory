# Avoiding Common Attacks
* Using the library [SafeMath](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol) will avoid
arithmetic overflows.
* The use of a multiplier for more precision rounding with integer division.
* Implementing the Fail early and fail loud design pattern to assure that the conditions for the function are properly met before any other code execution.
* Avoiding tx.origin to assure that the address calling the functions is the correct one.
* Implementing Pull over Push Payments design pattern to avoid re-entrancy and denial of service attacks.
* Implementing Circuit breaker design pattern in case a bug presents.
* Avoid changing state variables after transfer().
