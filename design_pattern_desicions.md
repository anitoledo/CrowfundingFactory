# Design Pattern Desicions
### Fail early and fail loud
With this pattern it can be assured that the conditions for the function are properly met before any other code execution.
### Restricting Access
Because it is an investing system certain functions need to be executed from specific user addresses so the flow of the contract 
is correctly executed.
### Pull over Push Payments
The contract is constantly receiving and transfering money, to avoid re-entrancy and denial of service attacks this pattern is the best solution.
### Circuit Breaker
In case a bug presents, the functions that manage money are stoped.
