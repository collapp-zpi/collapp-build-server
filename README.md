# collapp-build-server

## Build

> POST: https://collapp-build-server.herokuapp.com/build

```javascript
{
	"requestId": "",
  // url of a endpoint to hit with a response
	"ping": {
		"url": ""
	},
	"name": "",
	"zip": {
		"url": ""
	},
	"developer": {
		"name": "",
		"email": ""
	}
}
```

### Response

```javascript
{
  "requestId": "",
  "success": true,
  "build": {
    "success": true,
    "time": 0,
    "errors": []
  },
  "upload": {
    "name": "",
    "success": true,
    "files": []
  }
}
```

## List of plugins

> GET: https://collapp-build-server.herokuapp.com/plugins

## Delete a plugin

> DELETE: https://collapp-build-server.herokuapp.com/plugin/{plugin-name}

