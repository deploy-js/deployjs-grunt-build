/*eslint-env node*/
'use strict';

var RSVP = require('rsvp');
var glob  = require('glob');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var path = require('path');
const exec = require('child_process').exec;

module.exports = {
  name: 'deployjs-grunt-build',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        outputPath: 'dist'
      },

      build: function(/* context */) {
        var self       = this;
        var outputPath = this.readConfig('outputPath');

        this.log('building app to ' + outputPath + '...', { verbose: true });

        return new RSVP.Promise(function(resolve, reject) {
          exec('grunt build',
            {maxBuffer: 1024 * 1024 * 32},
            function(err, stdout, stderr)
          {
            if(err) {
              this.log(err, { color: 'red' });
              reject(err);
              return;
            }

            resolve(outputPath);
          }.bind(this));
        }.bind(this))
        .then(this._logSuccess.bind(this, outputPath))
        .then(function(files) {
          files = files || [];

          return {
            distDir: outputPath,
            distFiles: files
          };
        })
        .catch(function(error) {
          this.log('build failed', { color: 'red' });
          return RSVP.reject(error);
        }.bind(this));
      },
      _logSuccess: function(outputPath) {
        var self = this;
        var files = glob.sync('**/**/*', { nonull: false, nodir: true, cwd: outputPath });

        if (files && files.length) {
          files.forEach(function(path) {
            self.log('✔  ' + path, { verbose: true });
          });
        }
        self.log('build ok', { verbose: true });

        return RSVP.resolve(files);
      }
    });
    return new DeployPlugin();
  }
};
