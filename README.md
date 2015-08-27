# Link Tenant Management API

Currently a readonly API for accessing tenant information. Returns list of tenants, peers and devices connected to tenant. Peers and devices are cached to for 10 and 60 seconds, respectively.

## API Response

### GET /

```json
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Content-Length: 159
Date: Thu, 27 Aug 2015 14:26:37 GMT
Connection: keep-alive

{
  "class": [
    "root"
  ],
  "links": [
    {
      "rel": [
        "self"
      ],
      "href": "http://localhost:2000/"
    },
    {
      "rel": [
        "http://rels.zettajs.io/tenants"
      ],
      "href": "http://localhost:2000/tenants"
    }
  ]
}

```

### GET /tenants

```json
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Content-Length: 246
Date: Thu, 27 Aug 2015 14:19:01 GMT
Connection: keep-alive

{
  "class": [
    "tenants"
  ],
  "entities": [
    {
      "class": [
        "tenant"
      ],
      "rel": [
        "item"
      ],
      "properties": {
        "tenantId": "default"
      },
      "links": [
        {
          "rel": [
            "self"
          ],
          "href": "http://localhost:2000/tenants/default"
        }
      ]
    }
  ],
  "links": [
    {
      "rel": [
        "self"
      ],
      "href": "http://localhost:2000/tenants"
    }
  ]
}

```

### GET /tenants/{tenantId}

```json
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Content-Length: 687
Date: Thu, 27 Aug 2015 14:19:30 GMT
Connection: keep-alive

{
  "class": [
    "tenant"
  ],
  "properties": {
    "tenantId": "default",
    "totalPeers": 2,
    "totalDevices": 4
  },
  "entities": [
    {
      "class": [
        "peer"
      ],
      "properties": {
        "name": "99f85b03-7e98-428e-84f8-2cdb9da0ad82",
        "tenantId": "default",
        "created": "2015-08-27T14:19:16.052Z"
      },
      "rel": [
        "http://rels.zettajs.io/peer"
      ]
    },
    {
      "class": [
        "peer"
      ],
      "properties": {
        "name": "380a102b-f2d6-48a2-9c82-ad35dc9ac497",
        "tenantId": "default",
        "created": "2015-08-27T14:19:16.052Z"
      },
      "rel": [
        "http://rels.zettajs.io/peer"
      ]
    }
  ],
  "links": [
    {
      "rel": [
        "collection"
      ],
      "href": "http://localhost:2000/tenants"
    },
    {
      "rel": [
        "http://rels.zettajs.io/devices"
      ],
      "href": "http://localhost:2000/tenants/default/devices"
    },
    {
      "rel": [
        "self"
      ],
      "href": "http://localhost:2000/tenants/default"
    }
  ]
}
```

### GET /tenants/{tenantId}/devices

```json
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Content-Length: 1116
Date: Thu, 27 Aug 2015 14:19:51 GMT
Connection: keep-alive

{
  "class": [
    "devices"
  ],
  "properties": {
    "tenantId": "default",
    "totalDevices": 4
  },
  "entities": [
    {
      "class": [
        "device"
      ],
      "properties": {
        "id": "26ee56a3-4c48-4fe2-83ed-c924834359ee",
        "intensity": 1.7071067811865526,
        "type": "photocell",
        "name": "photocell",
        "peer": "99f85b03-7e98-428e-84f8-2cdb9da0ad82"
      },
      "rel": [
        "item",
        "http://rels.zettajs.io/device"
      ]
    },
    {
      "class": [
        "device"
      ],
      "properties": {
        "id": "b6e6fa08-bb26-4fff-9894-4fbc71a2158a",
        "type": "led",
        "state": "off",
        "peer": "99f85b03-7e98-428e-84f8-2cdb9da0ad82"
      },
      "rel": [
        "item",
        "http://rels.zettajs.io/device"
      ]
    },
    {
      "class": [
        "device"
      ],
      "properties": {
        "id": "1e872d65-8c6b-4806-a428-fe25ef2722d9",
        "intensity": 1.7071067811865526,
        "type": "photocell",
        "name": "photocell",
        "peer": "380a102b-f2d6-48a2-9c82-ad35dc9ac497"
      },
      "rel": [
        "item",
        "http://rels.zettajs.io/device"
      ]
    },
    {
      "class": [
        "device"
      ],
      "properties": {
        "id": "f4e779be-9a79-43f7-8203-9e666ba0d8f8",
        "type": "led",
        "state": "off",
        "peer": "380a102b-f2d6-48a2-9c82-ad35dc9ac497"
      },
      "rel": [
        "item",
        "http://rels.zettajs.io/device"
      ]
    }
  ],
  "links": [
    {
      "rel": [
        "up"
      ],
      "href": "http://localhost:2000/tenants/default/"
    },
    {
      "rel": [
        "self"
      ],
      "href": "http://localhost:2000/tenants/default/devices"
    }
  ]
}
```
