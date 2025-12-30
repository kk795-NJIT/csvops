# Export Security Checklist

## Webhook Export Security

### Before Sending Data:
- [ ] **Verify webhook URL** - Only use endpoints you control or trust completely
- [ ] **Check for HTTPS** - Never send data over HTTP (unencrypted)
- [ ] **Review data contents** - Ensure no passwords, API keys, or PII you don't intend to share
- [ ] **Test with sample data first** - Send a small batch before full export

### Signature Verification (for webhook receivers):
```javascript
// Verify the webhook signature on your server
const timestamp = req.headers['x-webhook-timestamp'];
const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);

// Recreate signature and compare
// Note: This uses a simple hash - for production, use HMAC-SHA256 with a shared secret
```

### Rate Limiting:
- Webhooks are sent once per export (not per row)
- Consider your endpoint's rate limits before large exports

---

## Google Sheets Export Security

### Data Privacy:
- [ ] CSV is downloaded locally - no data sent to external servers
- [ ] UTF-8 with BOM ensures proper character encoding
- [ ] Review data before importing into shared Google Sheets

### Apps Script Security:
- [ ] Only paste scripts from trusted sources
- [ ] Review script permissions before authorizing
- [ ] Use `importCSVDirect()` for sensitive data (no external URLs)

---

## General Best Practices

1. **Data Minimization**: Only export fields you need
2. **Access Control**: Limit who can access exported files
3. **Audit Trail**: Keep records of what was exported and when
4. **Encryption**: Store exported files in encrypted storage
5. **Retention**: Delete exports after they're no longer needed

---

## Headers Sent with Webhook

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `X-Webhook-Timestamp` | Unix timestamp in milliseconds |
| `X-Webhook-Signature` | `sha256=<hash>` signature for payload verification |
| `User-Agent` | `CSV-Import-Copilot/1.0` |

---

## Payload Structure

```json
{
  "data": [
    { "field1": "value1", "field2": "value2" },
    ...
  ],
  "metadata": {
    "exported_at": "2024-12-30T00:00:00.000Z",
    "row_count": 100,
    "source": "CSV Import Copilot",
    "file_name": "my_data"
  }
}
```

*Metadata is optional and can be disabled in the export modal.*
