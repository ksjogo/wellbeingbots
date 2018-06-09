build:
	cd embed && NODE_ENV=production npx webpack
	cp embed/dist/bundle.js www/js/index.js
	npx webpack	

lint:
	npx tslint -p . -c tslint.json **/*.tsx **/*.ts --fix  --exclude **/*.d.ts
