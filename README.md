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
    "totalDevices": 4,
    "peers": [
      {
        "name": "5372531a-5d89-47cc-8132-887455116d26",
        "tenantId": "default",
        "created": "2015-09-01T12:31:54.517Z"
      },
      {
        "name": "4a7a5b65-a909-4892-ae84-5d9be18c5e05",
        "tenantId": "default",
        "created": "2015-09-01T12:31:54.517Z"
      }
    ]
  },
  "links": [
    {
      "rel": [
        "collection"
      ],
      "href": "http://localhost:2000/tenants"
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

## Disclaimer

This is not an officially supported Google product.
