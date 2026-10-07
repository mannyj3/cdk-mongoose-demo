let mongoose;
let importError = null;

try {
    mongoose = require('mongoose');
} catch (err) {
    importError = err;
}

let User;
if (mongoose) {
    const userSchema = new mongoose.Schema(
        {
            name: { type: String, required: true },
            email: { type: String, required: true },
            city: String,
        },
        { timestamps: true }
    );
    User = mongoose.models.User || mongoose.model('User', userSchema);
}

async function connectToDb() {
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,

        asds
    });
}

const response = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body, null, 2),
});

exports.handler = async (event) => {
    const lambdaName = process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (importError) {
        console.error('Could not load mongoose:', importError);
        return response(500, {
            lambda: lambdaName,
            error: importError.code,
            message: importError.message.split('\n')[0],
        });
    }

    let data;
    try {
        data = JSON.parse(event.body || '{}');
    } catch {
        return response(400, { lambda: lambdaName, message: 'Request body must be valid JSON' });
    }

    try {
        await connectToDb();
        const saved = await User.create(data);
        return response(201, { lambda: lambdaName, message: 'Saved to MongoDB Atlas', data: saved });
    } catch (err) {
        console.error('DB error:', err);
        const status = err.name === 'ValidationError' ? 400 : 500;
        return response(status, { lambda: lambdaName, error: err.name, message: err.message });
    }
};