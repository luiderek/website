# Motivations

Slowly trying to annotate and make sense of the code for the prosemirror website collab demo for modification.

End goal is a lightweight webapp collaborative version of the zim wiki. 

Will eventually (if successful) have to transplant code with a different backend / bundling solution.

Seems like a good project to become more familiar with dealing with modules if anything. 

## Installation

npm install

make

npm run devserver -- --port 8888

That will get you a server at [localhost:8888](http://localhost:8888/)
that serves the files in `public/`, along with the collaborative
editing backend, and updates the demo pages to use
[moduleserve](https://github.com/marijnh/moduleserve) so that you can
run the demos directly from the source files, rather than using the
bundled code. You can now edit them and see the changes with a single
refresh. (Though the server-side collaborative code still needs a
server refresh to update.)

Note that this is not secure (it provides file system access of HTTP)
and not fast (the browser will fetch each module individually), and
should only be used for development, on your local machine, bound to
`localhost`.
