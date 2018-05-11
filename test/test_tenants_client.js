// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var assert = require('assert');
var zetta = require('zetta');
var zettacluster = require('zetta-cluster');
var LED = require('zetta-led-mock-driver');
var Photocell = require('zetta-photocell-mock-driver');
var TenantsClient = require('../clients/tenants_client');
var MockEtcd = require('./mocks/mock_etcd');

describe('Tenant client', function() {
  var client = null;
  var tenantId = 'example-tenant';
  var tenantId2 = 'example-tenant2';

  beforeEach(function(done) {
    client = new TenantsClient({ client: new MockEtcd });
    
    var cluster = zettacluster({ zetta: zetta })
      .server('cloud1')
      .server('hub1', [LED, Photocell], ['cloud1'])
      .server('cloud2')
      .server('hub2', [LED, Photocell], ['cloud2'])
      .server('cloud3')
      .server('hub3', [LED, Photocell], ['cloud3'])
      .server('cloud4')
      .server('hub4', [LED, Photocell], ['cloud4'])
      .on('ready', function() {
        function addTarget(name, tenantId) {
          var port = cluster.servers[name]._testPort;
          client._targets._client.set(client._targets._etcDirectory + '/localhost' + port, JSON.stringify({ type: 'cloud-target', url: 'http://localhost:' + port, version: '0', tenantId: tenantId, created: new Date() }));
        }
        addTarget('cloud1', tenantId);
        addTarget('cloud2', tenantId);
        addTarget('cloud3', tenantId2);
        addTarget('cloud4', tenantId2);

        function addPeer(name, peer, tenantId) {
          var port = cluster.servers[peer]._testPort;
          var value = JSON.stringify({ name: name, url: 'http://localhost:' + port, created: new Date(), tenantId: tenantId });
          client._router._client.set(client._router._etcDirectory + '/' + tenantId + '/' + name, value);
        }
        addPeer('hub1', 'cloud1', tenantId);
        addPeer('hub2', 'cloud2', tenantId);
        addPeer('hub3', 'cloud3', tenantId2);
        addPeer('hub4', 'cloud4', tenantId2);
        done();
      })
      .run(function(err) {
        if (err) {
          done(err);
        }
      })

    afterEach(function() {
      cluster.stop();
    })
  });

  
  it('#findAll should return all tenants', function(done){  
    client.findAll(function(err, results) {
      assert.ifError(err);
      assert.equal(results.length, 2);
      var tenant = results[0];
      assert.equal(tenant.tenantId, tenantId);
      done();
    });
  });

  it('#get should return existing tenant', function(done) {
    client.get(tenantId, function(err, tenant) {
      assert.ifError(err);
      assert.equal(tenant.tenantId, tenantId);
      done();
    });
  })

  it('#get return undefined as tenant for non existant tenant', function(done) {
    client.get('not-a-tenant', function(err, tenant) {
      assert.ifError(err);
      assert.equal(tenant, undefined);
      done();
    });
  })

  it('#peers return peers for tenant that exists', function(done) {
    client.peers(tenantId, function(err, peers) {
      assert.ifError(err);
      assert.equal(peers.length, 2);
      done();
    });
  })

  it('#peers return empty array for non-existant tenantId', function(done) {
    client.peers('not-a-tenant', function(err, peers) {
      assert.ifError(err);
      assert.equal(peers.length, 0);
      done();
    });
  })


  it('#devices should return a list devices for the tenant', function(done) {
    client.devices(tenantId, function(err, devices) {
      assert.ifError(err);
      assert.equal(devices.length, 4);
      devices.forEach(function(device) {
        assert(device.id);
        assert(device.peer);
        assert(device.properties);
      })
      done();
    });
  })

  it('#devices return empty array for non-existant tenantId', function(done) {
    client.devices('not-a-tenant', function(err, devices) {
      assert.ifError(err);
      assert.equal(devices.length, 0);
      done();
    });
  })

});
