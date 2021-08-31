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

### Implement drag and drop re-ordering items in the list by a `sort` field

### Implement editing items titles by clicking on them with type-style cursor
