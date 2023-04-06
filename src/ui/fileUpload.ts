namespace dynnoslice.ui {

	export interface File {
		name: string;
		contents: string;
	}

	/**
	 * Custom element for uploading files
	 */
	interface ViewModel {
		accepts: string;
		id: string;
		label: string;
		observable: KnockoutObservable<File>;
	}

	ko.components.register("file-upload", {
		viewModel: {
			createViewModel: (params: any, componentInfo: KnockoutComponentTypes.ComponentInfo) => {

				const viewModel: ViewModel = {
					accepts: params.accepts,
					id: params.id,
					label: params.label,
					observable: params.observable
				};

				const input: HTMLInputElement = (<HTMLElement>componentInfo.element).querySelector("input");
				input.addEventListener("change", () => {
					if (input.files.length > 0) {

						const fr = new FileReader();

						fr.addEventListener("load", (e: ProgressEvent) => {
							viewModel.observable({
								name: input.files[0].name,
								contents: <string>fr.result
							});
						});

						fr.readAsText(input.files[0]);
					}
				});

				return viewModel;
			}
		},
		template:
			`
        <div>
            <label data-bind="attr: {for: id}, text: label+':'"></label>
            <input type="file" data-bind="attr: {accept: accepts, id: id}"></input>
        </div>`
	});

}