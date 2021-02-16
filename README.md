# Portainer Desktop

[Portainer](https://www.portainer.io) PWA Wrapped with `electron.js`. 

![Portainer Desktop](./build/portainer.png)

## Usage
### Cloud Instance
1. Download [latest release](https://github.com/ExidCuter/portainer-desktop/releases/latest) or run `npm install` and run the app with `electron .` or build the app with `electron-builder`.
2. Click `Config -> Set Endpoint` and set the URL to your running Portainer instance.


### Self Hosted (Docker Compose part is optional)
1. Install Docker and docker-compose
2. Run `docker-compose up -d` <-- this will run a Portainer docker container with user `admin:password`
4. Download [latest release](https://github.com/ExidCuter/docker-registry-explorer-plugin/releases/latest) or run `npm install` and run the app with `electron .` or build the app with `electron-builder`.
5. By default, Portainer is running on `localhost:9000`. Endpoint location can be changed in the `config` menu.

## Auto Login
Auto login can be enabled in the `Config` menu.

This application has built in auto login for user `admin:password`.

If you want to change the password you can do it in the `main.js` and `docker-compose.yml` file.

## Trademarks and Copyrights
Portainer.io and the Portainer logo are trademarks or registered trademarks of Portainer.
    
