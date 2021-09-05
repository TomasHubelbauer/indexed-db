# IndexedDB

This is a simple web application demonstrating the use of the IndexedDB web API
in order to implement a to-do list application.

## Links

- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
  Shows the basic usage of the IndexedDB API
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
  Goes over the storage limit applied to IndexedDB (~20% of the free disk space)
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
  List all of the IndexedDB APIs implemented in Firefox
- https://developer.mozilla.org/en-US/docs/Tools/Storage_Inspector
  Documents a DevTools tab for viewing the contents of the IndexedDB - sometimes
  restarting the DevTools is required to pick up new databases, the Reload icon
  button in the Indexed DB section of this tab does not work reliably
  (https://bugzilla.mozilla.org/show_bug.cgi?id=1325219)

## Notes

- IndexedDB works on the `file:///` protocol - no need for `localhost` or CORS!
  Unless using ESM - in which I am. See `privacy.file_unique_origin` further.
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria#where_is_the_data_stored
  This is where the IndexedDB SQLite databases are stored.
  This folder is backed up by Time Machine, see below how to find it there.
- https://wiki.mozilla.org/Storage
  This is the closest "official" resources I was able to find that says SQLite
  is the underlying database of IndexedDB - even if it doesn't fully say it.

### `file:` protocol and CORS

Firefox will not allow for ESM to work on `file:` protocol due to CORS. A call
to another module using the `import` keyword will fail with an error that says:
*CORS request not HTTP*. More about this error at:
https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp

This can be worked around by using a static file server and using the `http:`
protocol or by setting `privacy.file_unique_origin` to `false` in the Firefox's
`about:config` page. This makes the browser vulnerable to this CVE:
https://www.mozilla.org/en-US/security/advisories/mfsa2019-21/#CVE-2019-11730.
More in this bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1558299. Do not
disable this mitigation if you plan on opening potentially malicious local HTML
files.

### IndexedDB SQLite Database

To find the database backing the IndexedDB instance of the page, go to Firefox >
Help > More Troubleshooting Information, scroll to the Application Basics group
and find the Profile Folder entry. Click the Show in Finder button and open the
pre-selected folder. You can also find this page using `about:support`.

https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data

Go to the `storage/default` directory (`default` comes from the `default` suffix
in the DevTools > Storage tab, Indexed DB > `file:///…/indexed-db/index.html` >
`indexed-db (default)` node label). Open the directory matching the origin path
(`file:///…/indexed-db/index.html` ~ `file++++…+indexed-db+index.html`) and go
to the `idb` subdirectory. There is a SQLite database with a random name. The
name seems to not be derived from the origin - it is the same for my `file:` and
`https:` origins.

https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria#where_is_the_data_stored

It has 3 tables in its schema containing interesting data:

`database` contains a single row with an `origin` column containing the origin.

`object_store` is just a list of the stores defined using the IndexedDB API.

`object_data` is where the actual IndexedDB data are, however, the data is
encrypted/encoded somehow. DB Browser for SQLite crashes while attempting to
view the contents of the table. SQLiteStudio is able to view the contents, but
since it is encoded, it is not readable.

It is possible to transfer the IndexedDB SQLite database between origins just by
copying the database from one origin's directory to another and changing the
`database` table `origin` column cell value to match. The name stays the same.

The `file:` origin's `database.origin` value is:
`file:///…/indexed-db/index.html`.
The `https:` origin's `database.origin` value is:
`https://tomashubelbauer.github.io^firstPartyDomain=tomashubelbauer.github.io`.

Backing up the database and then restoring it by replacing a newwer copy of the
origin's database with an older copy also works.

DB Browser for SQLite nor SQLiteStudio can open this database, only Firefox can,
but it is pretty trivial to open any IndexedDB SQLite database just by creating
an HTML file and using its path as the value for `database.origin` so this is
not a major issue. It would be nice to figure it out eventually, though, because
exporting the IndexedDB data by building up an object in the app and offering it
for download could get unreliable/impossible as the database gets large.

#### Files

Files are stored outside of the SQLite database file in a subdirectory of the
directory where the database file is stored and the subdirectory has the same
name as the database file with the `.files` "extension. They are not encrypted
or encoded in any way, they just lack extensions.

They also get deleted with the record that points to them if that is deleted.

### Time Machine Backup

Time Machine backs up the IndexedDB SQLite database file. You can find it in
Finder at Time Machine volume (*… (Backup)*) > date and time > Untitled - Data >
Users. Here right-click on the username folder and select New Terminal at Folder
and in the Terminal window paste the usual `about:support` profile path, e.g.:
`Library/Application Support/Firefox/Profiles/….default-release`. Further, go to
`storage/default/file++++Users+…+Desktop+indexed-db+index.html/idb` and there is
the backed up copy of the database file.

The local storage data is also backed up here, but IndexedDB makes more sense,
as it has a much more generous size quota.

## To-Do

### Research how to decode the SQLite file holding the IndexedDB data

Currently it is not viewable by just opening the database in DB Browser for
SQLite o SQLiteStudio. I have not found anything useful relating to how to open
this SQLite file in other software than Firefox yet.
