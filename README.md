# API Explorer

This project documents Auth0 API and Auth0 Authentication API. 

## Building

Run in the command line:

```sh
AUTH0_CLIENT_ID=XXXX AUTH0_CLIENT_SECRET=YYYY grunt
```

## API

In order to include API Explorer in your project you will need to do the following:

```html
<!-- Include 2.3.2 bootstrap css -->
<link href="//netdna.bootstrapcdn.com/bootstrap/2.3.2/css/bootstrap.min.css" rel="stylesheet" />
<!-- Include jQuery 1.11 -->
<script type="text/javascript" src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<!-- Add API Explorer dist files (located in dist folder after building) -->
<link rel="stylesheet" href="api-explorer.css" />
<script type="text/javascript" src="api-explorer.js"></script>

<!-- Add an element where you want to include it -->
<div id="my-api-explorer"> </div>

<script type="text/javascript" charset="utf-8">
  require(['api-explorer'], function () {
    var api_explorer = require('api-explorer');
    api_explorer({
      el:             $('#my-api-explorer'),  // Target div to include it
      isAuth:         false,                  // Render as Authentication API?
      tenantDomain:   'my.myauth0.com',       // Tenant URL where to point the requests
      docsDomain:     'docs.auth0.com',       // Where are auth0 docs located?
      clientId:       'XXXX',                 // Your Global Client ID goes here
      clientSecret:   'YYYY',                 // Your Global Client Secret goes here
      readOnly:       false,                  // Don't allow requets
      anchors:        true,                   // Should headers have anchors for linking?

      user: {                                 // User information (required for Auth API)
        id:    'john.doe',
        name:  'John Doe',
        mail:  'john@doe.com'
      }
    });
  });
</script>

```
