namespace dynnoslice {

	window.addEventListener("load", () => {

		shadersLoadPromise.then(() => {
			const root = (ReactDOM as any).createRoot(document.getElementById("app"));

			root.render(<ui.App></ui.App>);
		});
	});
}