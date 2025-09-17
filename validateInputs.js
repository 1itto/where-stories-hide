function validateInputs(req, res, next) {
    const forbiddenValues = [null, undefined, true, false];

    function checkObject(obj) {
        for (const key in obj) {
            const value = obj[key];

            if (forbiddenValues.includes(value) || typeof value === "number") {
                return { valid: false, key, value };
            }

            // If it's an object or array, check recursively
            if (typeof value === "object" && value !== null) {
                const result = checkObject(value);
                if (!result.valid) return result;
            }
        }
        return { valid: true };
    }

    const bodyCheck = checkObject(req.body);
    if (!bodyCheck.valid) {
        return res.status(400).json({
            error: "Invalid value"
        });
    }

    const queryCheck = checkObject(req.query);
    if (!queryCheck.valid) {
        return res.status(400).json({
            error: "Invalid value"
        });
    }

    const paramsCheck = checkObject(req.params);
    if (!paramsCheck.valid) {
        return res.status(400).json({
            error: "Invalid value"
        });
    }

    next();
}

module.exports = validateInputs;
