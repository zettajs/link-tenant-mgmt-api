var path = require('path');
var assert = require('assert');
var http = require('http');
var request = require('supertest');
var zetta = require('zetta');
var zettacluster = require('zetta-cluster');
var LED = require('zetta-led-mock-driver');
var Photocell = require('zetta-photocell-mock-driver');
var path = require('path');
var titan = require('titan');
var siren = require('argo-formatter-siren');
var TenantsResource = require('../resources/tenants');
var TenantsClient = require('../clients/tenants_client');
var MockEtcd = require('./mocks/mock_etcd');
var getBody = require('./mocks/getBody');

describe('Tenants API', function() {
  var client = null;
  var server = null;
  var tenantId = 'example-tenant';
  var tenantId2 = 'example-tenant2';
  var base = '/tenants';

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

        var pipeline = titan()
          .allow('*')
          .compress()
          .format({ directory: path.join(process.cwd(), '/formats'), engines: [siren], override: { 'application/json': siren } })
          .add(TenantsResource, client).build();

        server = http.createServer(pipeline.run);

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


  it('GET ' + base + '/ should return both tenants', function(done){  
    request(server)
      .get(base + '/')
      .expect(200)
      .expect(getBody(function(res, body) {
        assert(body.class.indexOf('tenants') >= 0)
        var self = body.links.filter(function(link) {
          return link.rel.indexOf('self') >= 0;
        });
        assert.equal(self.length, 1);
        body.entities.forEach(function(entry) {
          assert(entry.class.indexOf('tenant') >= 0)
          assert(entry.properties.tenantId);
          var self = entry.links.filter(function(link) {
            return link.rel.indexOf('self') >= 0;
          });
          assert.equal(self.length, 1);
        })
      }))
      .end(done)
  });


  it('GET ' + base + '/'  + tenantId + ' should return tenant details', function(done) {
    request(server)
      .get(base + '/' + tenantId)
      .expect(200)
      .expect(getBody(function(res, body) {
        assert(body.class.indexOf('tenant') >= 0)
        var self = body.links.filter(function(link) {
          return link.rel.indexOf('self') >= 0;
        });
        assert.equal(self.length, 1);

        assert.equal(body.properties.tenantId, tenantId);
        assert.equal(body.properties.totalPeers, 2);

        var devices = body.links.filter(function(link) {
          return link.rel.indexOf("http://rels.zettajs.io/devices") >= 0;
        });
        assert.equal(devices.length, 0);

        assert.equal(body.properties.peers.length, 2);
        body.properties.peers.forEach(function(entry) {
          assert.equal(entry.tenantId, tenantId);
          assert(entry.name);
          assert(entry.created);
        });

      }))
      .end(done);
  })

  it('GET ' + base + '/' + tenantId + ' should return tenant details with cache hit', function(done) {
    request(server)
      .get( base + '/' + tenantId)
      .expect(200)
      .expect(getBody(function(res, body) {
        request(server)
          .get('/tenants/' + tenantId)
          .expect(200)
          .expect(getBody(function(res, body) {


            assert(body.class.indexOf('tenant') >= 0)
            var self = body.links.filter(function(link) {
              return link.rel.indexOf('self') >= 0;
            });

            assert.equal(body.properties.tenantId, tenantId);
            assert.equal(body.properties.totalPeers, 2);
            assert.equal(body.properties.totalDevices, 4);
          }))
      }))
      .end(done);
  })

});
