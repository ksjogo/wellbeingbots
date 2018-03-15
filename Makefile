run:
	npx webpack	
	git commit -am "run me"
	git push

lint:
	npx tslint -p . -c tslint.json **/*.tsx **/*.ts --fix  --exclude **/*.d.ts
