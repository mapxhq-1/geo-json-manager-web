import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateStoredCreds } from "../utils/auth";

function ProtectedRoute({ children }) {
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const baseUrl = import.meta.env.VITE_API_BASE_URL;

	useEffect(() => {
		const checkCreds = async () => {
			const isValid = await validateStoredCreds(baseUrl);
			if (!isValid) {
				navigate("/login");
			} else {
				setLoading(false);
			}
		};
		checkCreds();
	}, [navigate, baseUrl]);

	if (loading) {
		return <p className="text-center mt-10">Validating credentials...</p>;
	}

	return children;
}

export default ProtectedRoute;
