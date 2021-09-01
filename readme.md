# IndexedDB

This is a simple web application demonstrating the use of the IndexedDB web API
in order to implement a to-do list application.

## Notes

- IndexedDB works on the `file:///` protocol - no need for `localhost` or CORS!
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria#where_is_the_data_stored
  This is where the IndexedDB SQLite databases are stored
- https://wiki.mozilla.org/Storage
  This is the closest "official" resources I was able to find that says SQLite
  is the underlying database of IndexedDB - even if it doesn't fully say it

## Resources

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

## To-Do

### Verify whether the IndexedDB SQLite file is portable between machines/FFs

I am curious in backing up the SQLite file itself instead of implementing a
backup functionality in this application. If the file can be taken and moved to
another machine with Firefox at the same path, or even moved between Firefox and
Firefox Nightly installations/profiles, that would make it an attractive option.

The reason implementing custom backup and restore logic is cumbersome is because
not only is it extra, possibly bug-prone, code that one has to implement, but
also because to implement it, the entire database would have to be read, stored
in the memory as a blob and then downloaded through `a[download]`. The database
might not fit into the available memory rendering this functionality broken in
possibly the least convenient moment for it to be broken.

### Research how to decode the SQLite file holding the IndexedDB data

Currently it is not viewable by just opening the database in DB Browser for
SQLite o SQLiteStudio. I have not found anything useful relating to how to open
this SQLite file in other software than Firefox yet.

### Determine whether the IndexedDB SQLite files are being Time Machine backuped

If they are, I might be able to get away with having Time Machine back them up
and not even implement import/export in the application.
