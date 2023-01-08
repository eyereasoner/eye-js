before=$(git show HEAD~1:./package.json | jq .config.eye.name)
current=$(cat ./package.json | jq .config.eye.name)

readarray -d . -t before <<<"${before:2:-1}"
readarray -d . -t after <<<"${current:2:-1}"

if [ ${before[0]} != ${after[0]} ]; then
  version="BREAKING CHANGE"
elif [ ${before[1]} != ${after[1]} ]; then
  version="feat"
elif [ ${before[2]} != ${after[2]} ]; then
  version="fix"
fi

git config --global user.name 'Jesse Wright'
git config --global user.email '63333554+jeswr@users.noreply.github.com'
git commit -am "$version: update to eye ${current:1:-1}"
git push
