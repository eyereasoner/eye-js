before=$(git diff HEAD~1 | grep "\-      \"name\"")
after=$(git diff HEAD~1 | grep "\+      \"name\"")

# Use change in eye version to determine whether
# this needs to be a major, minor or patch update
if [ ${before:17:2} != ${after:17:2} ]; then
  version="breaking"
elif [ ${before:20:4} != ${after:20:4} ]; then
  version="feat"
elif [ ${before:25:4} != ${after:25:4} ]; then
  version="fix"
fi

git config --global user.name 'Jesse Wright'
git config --global user.email '63333554+jeswr@users.noreply.github.com'
git commit -am "$version: update eye"
git push
