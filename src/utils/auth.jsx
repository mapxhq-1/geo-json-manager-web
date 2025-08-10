export const validateStoredCreds = async (baseUrl) => {
	const creds = JSON.parse(localStorage.getItem("geojson_creds"));
	if (!creds?.username || !creds?.password) return false;

	try {
		const res = await fetch(`${baseUrl}/geo-json-service/validate-creds`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(creds),
		});
		const data = await res.json();
		return res.ok && data.status === "success";
	} catch {
		return false;
	}
};

export const logout = () => {
	localStorage.removeItem("geojson_creds");
};
