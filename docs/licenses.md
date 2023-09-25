# Operately Licensing and Compatibility

To comply with the terms the libraries we use are licensed under, we have to make sure to check
every dependecy we use. To automate this process we use [License Finder](https://github.com/pivotal/LicenseFinder) 
from [Pivotal](https://github.com/pivotal). The licence check runs every time a new commit is pushed
and verifies the compatibility of all mix and node packages we use, and makes sure it doesn't conflict
with the licensing of Operately.

## Currently allowed licences

### MIT License

It is a permissive licence, compatible with Apache 2.0.
Note: *It needs to be included in all copies and distribution channels of Operately.*

### BSD License, Simplified BSD License, New BSD License

All of these are permitive licences.
Note: *They need to be included in all copies and distribution channels of Operately.*

### ISC

Permissive license, similar to MIT.
Note: *It needs to be included in all copies and distribution channels of Operately.*

Major dependecies, Cowboy, Cowlib, and Ranch, use this license.

### WTFPL

Permissive license. Does not require inclusion in the distribution channels.
Only one dependency uses this license: https://github.com/falood/file_system.
