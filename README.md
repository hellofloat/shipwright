![Shipwright](/shipwright.jpg?raw=true)

Shipwright
=========

Shipwright is a command line interface for interacting with [DigitalOcean](https://digitalocean.com/).

It is a very lightweight wrapper around the API. Effectively it just wraps up some of the painful
bits you'd need to do if you were using curl.

As such, the best docs on what you can do can be read here: [https://developers.digitalocean.com/documentation/v2](https://developers.digitalocean.com/documentation/v2)

## Installation

### Requirements

Shipwright requires *node.js* and *npm*.

### Install via npm

You can install Shipwright using npm globally on your computer:

```
npm install -g shipwright
```

## Usage

```
usage: shipwright [OPTIONS] OPERATION RESOURCE [ARGS]
options:
    --version       Print version and exit.
    -h, --help      Print this help and exit.
    -v, --verbose   Enable verbose output.
    --token=TOKEN   Specifies your DO API token. Environment: DO_TOKEN=TOKEN
    --fromfile=ARG  Allows you to read a given value from a file, eg:
                    --fromfile=userdata,~/user-data.
    --json          Output responses in raw JSON.
    --pretty        If set, will output more human-readable JSON.
    --stdin         If set, will read the request body from stdin.
```

### Operations

- get
- create (alias for 'post')
- put
- delete

### Resources

Refer to the DigitalOcean [API docs](https://developers.digitalocean.com/documentation/v2)

### Arguments

Arguments are parsed in a key=value fashion and are added to the request either as a request
body or as a query string.

```--fromfile``` is an interesting option that lets you read the given argument in from a
file on disk. This is particularly useful for something like user_data. (See examples below.)

### Authentication

Shipwright will first check for a DigitalOcean API token via the --token option.

Failing that, it will check the environment variable DO_TOKEN.

Failing that, Shipwright will look for a file in your home directory containing your API token:

```
.digitalocean.token
```

This last method is the recommended method: create a .digitalocean.token file by cutting/pasting your
DigitalOcean API token.

## Examples

Let's get a list of our SSH keys stored with DigitalOcean (we'll use them later):

```
> shipwright get account/keys
ssh_keys: 
    - 
    id:          <key id>
    fingerprint: <key fingerprint>
    public_key:  <key>
    name:        <key name>
    - 
    id:          <key id>
    fingerprint: <key fingerprint>
    public_key:  <key>
    name:        <key name>
...
```

Let's see what pre-built applications DigitalOcean has for us to use as images:

```
> shipwright.js get images type=application
images: 
    - 
    id:            6423475
    name:          WordPress on 14.04
    distribution:  Ubuntu
    slug:          wordpress
    public:        true
    regions: 
        - nyc1
        - ams1
        - sfo1
        - nyc2
        - ams2
        - sgp1
        - lon1
        - nyc3
        - ams3
        - fra1
    created_at:    2014-09-28T21:34:48Z
    min_disk_size: 20
    type:          snapshot
    - 
    id:            10163059
    name:          FreeBSD AMP on 10.1
    distribution:  FreeBSD
    slug:          freebsd-amp
    public:        true
    regions: 
        - nyc1
        - ams1
        - sfo1
        - nyc2
        - ams2
        - sgp1
        - lon1
        - nyc3
        - ams3
        - fra1
    created_at:    2015-01-21T15:45:44Z
    min_disk_size: 20
    type:          snapshot
...
```

Let's create a droplet in sfo1, 512mb of ram, some user data, private networking and from a docker image:

```
> shipwright create droplets --fromfile=user_data,~/docker/base-userdata name=01-sfo1-docker region=sfo1 size=512mb image=docker ssh_keys=[<key id>,<key id>] private_networking=true 
droplet: 
    features: 
        - virtio
    id:                 <droplet id>
    vcpus:              1
    networks: 

    name:               01-sfo1-docker
    disk:               20
    memory:             512
    locked:             true
    size: 

    snapshot_ids: 
        (empty array)
    backup_ids: 
        (empty array)
    image: 

    kernel: 
    id:      4782
    name:    Ubuntu 14.04 x64 vmlinuz-3.13.0-52-generic-docker-memlimit
    version: 3.13.0-52-generic
    size_slug:          512mb
    status:             new
    next_backup_window: null
    created_at:         2015-06-19T20:32:02Z
    region: 

    links: 
        actions: 
            - 
            id:   <action id>
            rel:  create
            href: https://api.digitalocean.com/v2/actions/<action id>
```

## Contributing

Pull requests are very welcome! Just make sure your code:

1) Passes jshint given the included .jshintrc
2) Is beautified using jsbeautifier and the included .jsbeautifyrc

## Why?

I wanted a command line tool that gave me nearly direct access to the DigitalOcean API. Shipwright
basically just passes things on to the API. It's really just a glorified curl.

# CHANGELOG

v0.0.1
------
- Initial release.
