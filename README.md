# API Explorer

This project documents Auth0 API and Auth0 Authentication API.

## Building

Install project dependencies:

```sh
npm i && bower i
```

Add to `/etc/auth0.config`:
```sh
ALLOWED_ORIGINS="http://localhost:8443"
```

Run grunt in development mode:

```sh
MYAUTH0_CLIENT_ID=XXXX MYAUTH0_CLIENT_SECRET=YYYY grunt dev
```

and open [http://localhost:8443/](http://localhost:8443/)

If you are getting:

```js
{"error":"invalid_grant","error_description":"invalid client credentials - too many requests"}
```

Then, you may want to disable in `auth0-server` the `lib/limits/client_credentials` middleware.

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
      clientId:       'YOUR_CLIENT_ID',       // Your Global Client ID goes here
      clientSecret:   'YOUR_CLIENT_SECRET',   // Your Global Client Secret goes here
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

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
