import axios from "axios";

// REPO VERIFIER
export const axiosGithubverifier = async (url) => {
    const res = await axios.head(url, { validateStatus: () => true });
    if (res.status !== 200) {
        if (res.status === 404) {
            const error = new Error("GitHub repository does not exist or is private");
            error.status = 404;
            throw error;
        } else if (res.status === 403 || res.status === 429) {
            const error = new Error("GitHub API rate limited or forbidden");
            error.status = res.status;
            throw error;
        } else {
            const error = new Error("Unknown error checking repository");
            error.status = res.status;
            throw error;
        }
    }
};

// URL VERIFIER
export const axiosURLverifier = async (url) => {
    const res = await axios.head(url, { validateStatus: () => true });
    if (res.status !== 200){
        const error = new Error("Website is not accessible. Please check the URL and try again.");
        error.status = 404;
        throw error;
    }
};