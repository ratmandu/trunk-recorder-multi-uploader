# trunk-recorder-multi-uploader

This is a simple upload script for trunk-recorder, for uploading to more than one OpenMHZ/trunk-server instance or system.

Put this in the same folder as your trunk-recorder executable, fill in the api keys, endpoints, and shortnames, then add

```json
"uploadScript": "multi-uploader.js"
```
to each of your **systems** in your *config.json* file.
