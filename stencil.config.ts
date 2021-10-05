import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ng-layer-tune',
  devServer: {
    reloadStrategy: 'pageReload',
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements-bundle',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },    {
      type: 'www',
      copy: [
        {
          src: '../node_modules/export-nehuba/dist/min/*.js',
          dest: './'
        }
      ]
    }
  ],
};
