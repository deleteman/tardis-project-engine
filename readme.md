
# Project Tardis - Back-end module

Welcome to Project Tardis, this is my humble attempt at taking you back in time (hence the name, get it?) to an era where Text Adventures where the greatest form of digital entretainment... with a twist. 

This project attempts to provide a back-end service able to serve as a game server, capable of supporting a variaty of text adventures that can be played, both, in single and multi-player mode.

For details about this project, please refer to the following articles:

+ General project plan and architecture: https://www.smashingmagazine.com/2018/12/multiplayer-text-adventure-engine-node-js/
+ Game server development and details: TBD
+ CLI client development and details: TBD
+ Chat server details: TBd

# Endpoints

| **Verb**   | **Endpoint**   | **Description**   |
|---|---|---|
| POST  | /clients   |Registers a new client application on the game server   |
| POST   |/games   |  Create a new game using one of the pre-set cartridges (JSON files) in the system |
| POST  | /games/:id   |  Join an existing game|  
| GET | /games/:id/:playername   |   Get he game state of a player for a particular game| 
| POST  | /games/:id/:playername/:scene   | Sends a command to the game server

## Data requests

### Registering a new client

POST /clients
Payload: 
```
{
	"name": "Your client app name"
}
```

Response: 
```
{
    "_id": "5c69eeea9dbb6267b3cbefec",
    "name": "Your client app name"
    "unique_name": "test_client_app123",
    "apikey": "35bca390-330c-11e9-988c-477a3f243006",
    "registrationDate": "2019-02-17T23:31:54.569Z",
    "__v": 0
}
```

### Creating a new game
POST /games
Header: 
+ apikey: 35bca390-330c-11e9-988c-477a3f243006
Payload:
```
{
	"cartridgeid": "sample"
}
```

Response: 
```
{
    "_id": "5c69f269ed1b636ad4e1d274",
    "cartridgeid": "sample",
    "creationdate": "2019-02-17T23:46:49.757Z",
    "scenes": {
    	//the full cardtridge json
    },
    "__v": 0
}
```

### Joining a new game

POST /games/:id
Headers:
+ apikey: 35bca390-330c-11e9-988c-477a3f243006
Payload:
```
{
	
	"playername": "deleteman2"
}

```

Response:

```
{
    "_id": "5c69efe59dbb6267b3cbefed",
    "playername": "deleteman2",
    "game": "5c69eeea9dbb6267b3cbefec",
    "playerkey": "cb07c920-330c-11e9-988c-477a3f243006",
    "creationdate": "2019-02-17T23:36:05.042Z",
    "walkedwest": 0,
    "walkedeast": 0,
    "walkedsouth": 0,
    "walkednorth": 0,
    "playerhp": 10,
    "inventory": {
        "bag": [],
        "_id": "5c69efe59dbb6267b3cbefee",
        "hands": null
    },
    "currentscene": "entrance",
    "__v": 0
}
```

### Getting current status

GET  /games/:id/:playername

Headers:
+ apikey: 35bca390-330c-11e9-988c-477a3f243006

Response:
```
{
    "_id": "5c69efe59dbb6267b3cbefed",
    "playername": "deleteman2",
    "game": "5c69eeea9dbb6267b3cbefec",
    "playerkey": "cb07c920-330c-11e9-988c-477a3f243006",
    "creationdate": "2019-02-17T23:36:05.042Z",
    "walkedwest": 0,
    "walkedeast": 0,
    "walkedsouth": 0,
    "walkednorth": 0,
    "playerhp": 10,
    "inventory": {
        "bag": [],
        "_id": "5c69efe59dbb6267b3cbefee",
        "hands": null
    },
    "currentscene": "entrance",
    "__v": 0
}
```

### Sending a command to the server

POST  /games/:id/:playername/:scene

Headers:
+ apikey: 35bca390-330c-11e9-988c-477a3f243006

Payload:
```
{
	"action": "look at room"
}
```

Response:
```
{
    "gamestate": {
        "_id": "5c69f2bfed1b636ad4e1d275",
        "playername": "deleteman3",
        "game": {
        	//complete game object (including cartdrige json)
        	},
        "playerkey": "7e24a400-330e-11e9-8930-4745e4a800d3",
        "creationdate": "2019-02-17T23:48:15.041Z",
        "walkedwest": 0,
        "walkedeast": 0,
        "walkedsouth": 0,
        "walkednorth": 0,
        "playerhp": 10,
        "inventory": {
            "bag": [],
            "_id": "5c69f2bfed1b636ad4e1d276",
            "hands": null
        },
        "currentscene": "entrance",
        "__v": 0
    },
    "message": {
        "message": "You're at the entrance of the dungeon. There are two lit torches on each wall (one on your right and one on your left). You see only one path: ahead."
    }
}
```

# Starting the project
In order to start the game engine, you only have to use the following command:


```
$ npm start
```

