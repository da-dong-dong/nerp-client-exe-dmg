let self;
if (self) {
	self.addEventListener('message', () => {
		console.log(222)
	  self.postMessage('You said: ');
	}, false);
}

