# AMNKO HSE Library Order — Final Status

Generated from current repository evidence. No Neon, Blob, Production, DATABASE_URL, Git, or deployment changes were made.

## Confirmed counts

- Reference manifest: 579 items.
- Current API documents: 348.
- Manifest items with confirmed source linkage: 273.
- API rows with confirmed reference order: 268.
- API rows with fixed fallback order: 80 (the remaining current documents after reference-linked rows), using the stable current `document_id` key returned by the database; this is not claimed as original source order.
- Difference: seven manifest pathnames are absent from the API set; two API rows use `.txt` for the same stem where the manifest has `.pdf`. No extension was rewritten.
- The full original order remains unprovable with current data; only the 268 reference-linked rows have confirmed source order.

## Seven manifest/API differences

| Manifest pathname | Difference | Required source |
|---|---|---|
| amnko-library/616__d1c89b26-fb7f-45d7-8780-e07689025b2b.pdf | API has the same stem with `.txt`, not `.pdf`; requires authoritative storage/export reconciliation | Current joined export of document_id, original pathname, and hash |
| amnko-library/5__482aa17c-c9aa-4ebe-8a4e-a3143472b80d.pdf | Manifest pathname absent from current 348-row API | Current joined export of document_id, original pathname, and hash |
| amnko-library/7__6f33b2fe-8e85-4b4f-9cb7-5889fc9a8897.pdf | Manifest pathname absent from current 348-row API | Current joined export of document_id, original pathname, and hash |
| amnko-library/10__9286c6f2-65d4-4f60-b4e5-8e8ce7f4df61.pdf | Manifest pathname absent from current 348-row API | Current joined export of document_id, original pathname, and hash |
| amnko-library/557__82ce8628-6562-42fb-af84-c25d07b9b2dd.pdf | Manifest pathname absent from current 348-row API | Current joined export of document_id, original pathname, and hash |
| amnko-library/528__cab11cbf-235d-4588-af7c-be36b44c50bf.pdf | API has the same stem with `.txt`, not `.pdf`; requires authoritative storage/export reconciliation | Current joined export of document_id, original pathname, and hash |
| amnko-library/209__0238fe50-0e8d-43be-a05c-a35a487c5c35.pdf | Manifest pathname absent from current 348-row API | Current joined export of document_id, original pathname, and hash |

## Unresolved manifest items

The following 306 reference positions have no confirmed LibraryId + Rowguid + SHA256/pathname evidence. They remain in reference order and are not matched by name similarity.

| Reference order | LibraryId | Rowguid | SHA256 | blobPathname | reason |
|---:|---|---|---|---|---|
| 1 | 2 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 13 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 14 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 15 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 16 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 17 | 575 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 34 | 22 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 35 | 341 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 40 | 336 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 41 | 355 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 46 | 390 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 57 | 347 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 65 | 384 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 71 | 369 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 80 | 378 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 86 | 598 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 87 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 89 | 648 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 93 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 94 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 95 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 96 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 104 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 107 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 108 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 109 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 110 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 111 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 112 | 599 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 114 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 115 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 117 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 118 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 119 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 120 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 121 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 122 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 123 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 124 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 126 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 127 | 316 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 128 | 318 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 131 | 320 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 132 | 474 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 142 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 143 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 144 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 145 | 639 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 146 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 147 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 148 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 149 | 640 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 151 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 155 | 481 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 156 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 157 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 158 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 159 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 161 | 430 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 162 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 163 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 164 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 165 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 166 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 167 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 168 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 169 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 171 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 172 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 175 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 176 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 177 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 178 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 179 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 180 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 181 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 182 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 183 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 184 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 185 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 186 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 187 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 188 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 189 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 190 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 191 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 192 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 193 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 194 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 195 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 196 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 197 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 198 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 199 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 200 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 201 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 202 | 245 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 203 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 204 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 205 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 206 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 207 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 208 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 209 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 210 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 211 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 212 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 213 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 214 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 215 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 216 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 217 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 218 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 219 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 220 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 221 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 222 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 223 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 224 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 225 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 226 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 227 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 228 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 229 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 230 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 231 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 232 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 233 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 234 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 235 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 236 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 237 | 448 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 239 | 27 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 240 | 34 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 241 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 242 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 245 | 652 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 247 | 37 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 249 | 39 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 251 | 551 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 253 | 41 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 255 | 45 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 257 | 47 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 259 | 49 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 261 | 150 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 263 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 264 | 51 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 266 | 53 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 267 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 268 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 269 | 55 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 270 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 272 | 57 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 274 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 275 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 276 | 43 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 278 | 59 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 279 | 67 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 283 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 284 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 285 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 286 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 287 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 289 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 291 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 293 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 294 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 295 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 296 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 297 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 298 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 299 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 300 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 301 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 302 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 303 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 304 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 305 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 306 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 307 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 308 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 309 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 310 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 313 | 199 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 316 | 593 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 318 | 548 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 320 | 71 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 322 | 73 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 324 | 452 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 326 | 75 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 329 | 78 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 331 | 619 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 333 | 621 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 335 | 80 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 337 | 538 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 339 | 205 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 340 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 341 | 93 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 343 | 602 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 345 | 95 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 348 | 98 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 352 | 102 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 354 | 84 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 356 | 420 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 361 | 106 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 363 | 108 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 365 | 110 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 369 | 114 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 371 | 560 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 373 | 116 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 375 | 118 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 377 | 120 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 379 | 304 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 389 | 122 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 392 | 125 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 400 | 133 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 402 | 135 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 407 | 140 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 409 | 142 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 411 | 422 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 413 | 145 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 414 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 415 | 147 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 419 | 446 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 421 | 635 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 423 | 157 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 425 | 153 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 427 | 334 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 429 | 161 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 431 | 155 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 433 | 159 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 434 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 435 | 193 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 437 | 163 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 441 | 462 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 443 | 464 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 445 | 167 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 448 | 172 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 450 | 170 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 452 | 175 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 453 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 454 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 456 | 181 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 458 | 596 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 460 | 183 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 462 | 104 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 465 | 185 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 467 | 187 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 469 | 189 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 470 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 471 | 195 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 474 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 475 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 476 | 191 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 479 | 443 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 481 | 201 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 483 | 203 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 484 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 485 | 628 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 486 | 629 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 489 | 564 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 490 | 565 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 492 | 570 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 494 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 495 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 496 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 498 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 499 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 500 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 501 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 502 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 503 | 207 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 504 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 521 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 527 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 532 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 533 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 541 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 542 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 543 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 544 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 545 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 546 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 547 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 548 | 241 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 549 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 550 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 551 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 552 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 553 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 554 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 555 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 556 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 557 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 558 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 559 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 560 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 561 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 563 | 641 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 564 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 565 |  |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 567 | 19 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 568 | 360 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 577 | 21 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 578 | 17 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |
| 579 | 18 |  |  |  | UNRESOLVED: no extracted-trace SourceName record |

## Evidence and required source

- Historical `config/amnko-library-order.json`: commits `49b04634`, `0a22fce`, and `141b168`; no version adds a mapping beyond the current 273.
- Historical `reports/amnko-library-extracted-trace.csv` at `412d238`: same 348-source trace and no complete archive mapping.
- Current evidence: extracted trace, blob trace, content crosswalk, local export manifest, import plan, and link recovery reports.
- To resolve remaining cases: provide a complete original archive/export or import ledger containing each missing LibraryId with Rowguid or SHA256 and resulting document_id/blob_pathname. Extension variants require an authoritative current storage/export row proving object identity.

## Validation

- API result: 348 documents; confirmed reference order remains 268.
- No manifest/API mapping was changed because no new proof was found.
- `pnpm build` is run separately for this turn.
