# Github Dependency Checker

This node app searches through a GitHub organization and all its repositories to build a dependency tree graph. The graph is then rendered to visualize the dependencies between repositories within the organization.

## Prerequisites

You need a .env file with these variables:

```env
TOKEN=token_with_read_rights_for_org
ORG_NAME=your_org_name
```

## How To

The line that limits the number of repositories has to be greater than the total number of repositories in your organisation for the application to scan all of them.

It is advisable to start with a lower number to speed up debugging. Once you know the connection works and you have the proper token permissions, you can increase the limit.

```js
const LIMIT = 200;
```

## Debugging

Run the file `testHttps.js` to debug the connection. If it doesn't work, it is probably due to your Token not having the proper permissions to read all the repositories from the organisation.
