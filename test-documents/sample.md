# Markdown Test Document

This is a **markdown** document to test the ingestion pipeline.

## Features

- Support for *italic* and **bold** text
- Lists and sublists
- Code blocks
- Links and references

## Code Example

```javascript
function processDocument(filePath) {
  return extractText(filePath)
    .then(text => chunkText(text))
    .then(chunks => storeInDatabase(chunks));
}
```

## Testing Results

When this document is processed, it should:

1. Extract all text content
2. Preserve markdown formatting in metadata
3. Create appropriate chunks
4. Store in the database successfully

## Conclusion

This markdown document tests the text processing capabilities of the system and ensures that markdown files are handled correctly during ingestion.
