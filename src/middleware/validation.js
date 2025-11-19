import Joi from 'joi';

/**
 * Validation middleware using Joi
 */

/**
 * Joi schemas for todo validation
 */
export const todoSchemas = {
    create: Joi.object({
        title: Joi.string().min(1).max(200).required().messages({
            'string.empty': 'Title is required',
            'string.max': 'Title must be less than 200 characters',
        }),
        description: Joi.string().max(1000).allow('').optional().messages({
            'string.max': 'Description must be less than 1000 characters',
        }),
    }),

    update: Joi.object({
        title: Joi.string().min(1).max(200).optional().messages({
            'string.empty': 'Title cannot be empty',
            'string.max': 'Title must be less than 200 characters',
        }),
        description: Joi.string().max(1000).allow('').optional().messages({
            'string.max': 'Description must be less than 1000 characters',
        }),
        completed: Joi.boolean().optional(),
    })
        .min(1)
        .messages({
            'object.min': 'At least one field must be provided for update',
        }),

    id: Joi.object({
        id: Joi.number().integer().positive().required().messages({
            'number.base': 'ID must be a number',
            'number.integer': 'ID must be an integer',
            'number.positive': 'ID must be positive',
            'any.required': 'ID is required',
        }),
    }),
};

/**
 * Validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express-style middleware function
 */
export function validate(schema, property = 'body') {
    return async (request) => {
        try {
            const data =
                property === 'body'
                    ? await request.json()
                    : property === 'params'
                        ? request.params
                        : Object.fromEntries(new URL(request.url).searchParams);

            const { error, value } = schema.validate(data, { abortEarly: false });

            if (error) {
                const errors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }));

                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Validation failed',
                        details: errors,
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }

            // Store validated data back in request
            if (property === 'body') {
                // For body validation, we need to recreate the request with validated data
                request.validatedData = value;
            } else {
                request.validatedParams = value;
            }

            return undefined; // Continue to next middleware
        } catch (err) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    };
}

/**
 * Combined validation for create todo
 */
export const validateCreateTodo = validate(todoSchemas.create);

/**
 * Combined validation for update todo
 */
export const validateUpdateTodo = validate(todoSchemas.update);

/**
 * Combined validation for todo ID
 */
export const validateTodoId = validate(todoSchemas.id, 'params');
