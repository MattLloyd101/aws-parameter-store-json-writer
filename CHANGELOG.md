# AWS Parameter Store Json Writer - Changelog

## 2018-11-27 Version 1.1.1

* (Bug fix) - Issue when handling dates in StringList types. Now properly converts to ISO Date format.
* (Bug fix) - Issue that would cause StringList types to be serialised incorrectly when there are items which their toString returns a comma.

## 2018-11-26 Version 1.1.0

* (Feature) - Added automatic exponential back off on Throttling Exceptions. 
* (Bug fix) - Issue when secrets array was not supplied.

## 2018-11-23 Version 1.0.0

* Initial Release.