import type { ExtensionContext } from '@podman-desktop/api';
import * as extensionApi from '@podman-desktop/api';
import fs from 'node:fs';
import { RpcExtension } from '/@shared/src/messages/MessageProxy';
import { ServicesApiImpl } from './services-api';
import type { ServicesApi } from '/@shared/src/ServicesApi';
import type { CreatePgadminContainerOptions } from './managers/services';
import { ServicesManager } from './managers/services';

/**
 * Below is the "typical" extension.ts file that is used to activate and deactrivate the extension.
 * this file as well as package.json are the two main files that are required to develop a Podman Desktop extension.
 */

// Initialize the activation of the extension.
export async function activate(extensionContext: ExtensionContext): Promise<void> {
  console.log('starting extension');

  // A web view panel is created to display the index
  // we use the 'media' folder that contains the bread-and-butter of the webview.
  // it is assumed that index.html is the main file that is being displayed and all other files have already been generated.
  //
  // The 'index.html' and all other files are built with the `yarn build` command within packages/frontend which can also be ran with the
  // `yarn build` command in the main directory, which will also build the backend and shared packages.
  const panel = extensionApi.window.createWebviewPanel('postgresql', 'PostgreSQL', {
    localResourceRoots: [extensionApi.Uri.joinPath(extensionContext.extensionUri, 'media')],
  });
  extensionContext.subscriptions.push(panel);

  // Set the index.html file for the webview.
  const indexHtmlUri = extensionApi.Uri.joinPath(extensionContext.extensionUri, 'media', 'index.html');
  const indexHtmlPath = indexHtmlUri.fsPath;
  let indexHtml = await fs.promises.readFile(indexHtmlPath, 'utf8');

  // TEMPORARY. This is a workaround to replace the src of the script tag in the index.html file so that links work correctly.
  // In the content <script type="module" crossorigin src="./index-RKnfBG18.js"></script> replaces src with webview.asWebviewUri
  const scriptLink = indexHtml.match(/<script.*?src="(.*?)".*?>/g);
  if (scriptLink) {
    scriptLink.forEach(link => {
      const src = link.match(/src="(.*?)"/);
      if (src) {
        const webviewSrc = panel.webview.asWebviewUri(
          extensionApi.Uri.joinPath(extensionContext.extensionUri, 'media', src[1]),
        );
        indexHtml = indexHtml.replace(src[1], webviewSrc.toString());
      }
    });
  }

  // TEMPORARY. We do the same for the css link
  const cssLink = indexHtml.match(/<link.*?href="(.*?)".*?>/g);
  if (cssLink) {
    cssLink.forEach(link => {
      const href = link.match(/href="(.*?)"/);
      if (href) {
        const webviewHref = panel.webview.asWebviewUri(
          extensionApi.Uri.joinPath(extensionContext.extensionUri, 'media', href[1]),
        );
        indexHtml = indexHtml.replace(href[1], webviewHref.toString());
      }
    });
  }

  // Update the webview panel with the new index.html file with corrected links.
  panel.webview.html = indexHtml;

  // managers are created
  const servicesManager = new ServicesManager(extensionContext, panel.webview);
  await servicesManager.init();

  // We now register the 'api' for the webview to communicate to the backend
  const rpcExtension = new RpcExtension(panel.webview);
  const servicesApi = new ServicesApiImpl(extensionContext, panel.webview, servicesManager);
  rpcExtension.registerInstance<ServicesApi>(ServicesApiImpl, servicesApi);

  extensionContext.subscriptions.push(
    extensionApi.commands.registerCommand('postgresql.pgadmin.start', async container => {
      container.Id = container.id;
      container.Image = container.image;
      container.Names = [container.name];
      container.Ports = container.ports;
      const service = await servicesManager.getServiceFromContainerInfo(container);
      const provider = await servicesManager.getFirstPodmanProvider();
      await extensionApi.containerEngine.pullImage(provider.connection, 'dpage/pgadmin4', () => {
        /* todo logs */
      });
      const pgAdminContainer = await servicesManager.createPgadminContainer(
        container.engineId,
        undefined,
        `${service.name}-pgadmin`,
        {
          dbname: service.dbName,
          user: service.user,
          password: service.password,
          port: service.port,
          containerId: container.Id,
        } as CreatePgadminContainerOptions,
      );
      await extensionApi.containerEngine.startContainer(pgAdminContainer.engineId, pgAdminContainer.id);
    }),
  );
}

export async function deactivate(): Promise<void> {
  console.log('stopping extension');
}
