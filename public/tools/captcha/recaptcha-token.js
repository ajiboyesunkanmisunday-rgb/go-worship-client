"use strict";

/* ==========================================================================
 * Go-Worship Classic reCAPTCHA v3 Development Request Generator
 * ========================================================================== */

const CAPTCHA_SITE_KEY_ENDPOINT =
    "/api/v1/auth/captcha/site-key";

const DEFAULT_NONCE_BYTE_LENGTH =
    24;

/* ==========================================================================
 * Action configuration
 * ========================================================================== */

const ACTION_CONFIG = Object.freeze({

    LOGIN: Object.freeze({
        action: "LOGIN",
        method: "POST",
        path: "/api/v1/auth/login",
        bodyType: "LOGIN",
        loginVisible: true
    }),

    REGISTER: Object.freeze({
        action: "REGISTER",
        method: "POST",
        path: "/api/v1/auth/register",
        bodyType: "REGISTER",
        loginVisible: true,
        registrationVisible: true
    }),

    FIRST_LOGIN: Object.freeze({
        action: "FIRST_LOGIN",
        method: "POST",
        path: "/api/v1/auth/first-login/link/consume",
        bodyType: "FIRST_LOGIN_LINK",
        firstLoginLinkVisible: true
    }),

    FIRST_LOGIN_PASSWORD: Object.freeze({
        action: "FIRST_LOGIN_PASSWORD",
        method: "POST",
        path: "/api/v1/auth/first-login/password/complete",
        bodyType: "FIRST_LOGIN_PASSWORD",
        firstLoginPasswordVisible: true
    }),

    PASSWORD_RESET: Object.freeze({
        action: "PASSWORD_RESET",
        method: "POST",
        path: "/api/v1/auth/forgot-password",
        bodyType: "FORGOT_PASSWORD",
        emailVisible: true,
        passwordResetVisible: true
    }),

    OTP_SEND: Object.freeze({
        action: "OTP_SEND",
        method: "POST",
        path: "/api/v1/auth/guest/otp/start",
        bodyType: "OTP_SEND",
        emailVisible: true
    }),

    OTP_VERIFY: Object.freeze({
        action: "OTP_VERIFY",
        method: "POST",
        path: "/api/v1/auth/guest/otp/verify",
        bodyType: "OTP_VERIFY",
        emailVisible: true,
        otpVisible: true
    }),

    CHECKOUT: Object.freeze({
        action: "CHECKOUT",
        method: "POST",
        path: "/api/v1/public/checkout",
        bodyType: "CHECKOUT",
        paymentVisible: true
    }),

    PAYMENT: Object.freeze({
        action: "PAYMENT",
        method: "POST",
        path: "/api/v1/public/payments",
        bodyType: "PAYMENT",
        paymentVisible: true
    })
});

/* ==========================================================================
 * State
 * ========================================================================== */

const elements = {};

let loadedSiteKey = "";
let captchaScriptPromise = null;

let lastToken = "";
let lastHeaders = {};
let lastBody = {};

/* ==========================================================================
 * Startup
 * ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);

async function initializePage() {

    initializeElements();
    registerEventListeners();
    synchronizeAction();

    try {

        await initializeCaptcha();

        setStatus(
            "Classic reCAPTCHA v3 loaded successfully. "
            + "Generate a fresh request immediately before calling the backend.",
            "success"
        );

    } catch (error) {

        console.error(
            "Captcha initialization failed",
            error
        );

        setStatus(
            "Captcha initialization failed: "
            + errorMessage(error),
            "error"
        );
    }
}

/* ==========================================================================
 * DOM initialization
 * ========================================================================== */

function initializeElements() {

    const ids = [

        "flow",
        "siteKey",
        "action",
        "path",
        "method",
        "tenantDomain",
        "proof",

        "loginSection",
        "username",
        "password",
        "rememberMe",

        "registrationSection",
        "firstName",
        "lastName",
        "registrationEmail",
        "confirmPassword",

        "firstLoginLinkSection",
        "firstLoginToken",

        "firstLoginPasswordSection",
        "challengeToken",
        "newPassword",
        "confirmNewPassword",
        "firstLoginRememberMe",

        "emailSection",
        "email",

        "passwordResetSection",
        "passwordResetToken",
        "passwordResetNewPassword",

        "otpSection",
        "otp",

        "paymentSection",
        "customerEmail",
        "amount",
        "currency",
        "reference",

        "googleLoginSection",
        "googleClientId",
        "googleButton",
        "googleIdToken",
        "initializeGoogleButton",
        "copyGoogleIdTokenButton",

        "generateButton",
        "status",

        "captchaTokenOutput",
        "copyCaptchaTokenButton",

        "requestUrlOutput",
        "headersOutput",
        "copyHeadersButton",
        "bodyOutput",
        "copyBodyButton"
    ];

    ids.forEach(id => {

        elements[id] =
            document.getElementById(id);
    });

    const missing =
        ids.filter(id => !elements[id]);

    if (missing.length > 0) {

        throw new Error(
            "Missing required HTML elements: "
            + missing.join(", ")
        );
    }
}

/* ==========================================================================
 * Event listeners
 * ========================================================================== */

function registerEventListeners() {

    elements.action.addEventListener(
        "change",
        synchronizeAction
    );

    elements.flow.addEventListener(
        "change",
        synchronizeFlow
    );

    elements.currency.addEventListener(
        "input",
        normalizeCurrency
    );

    elements.tenantDomain.addEventListener(
        "blur",
        () => {

            elements.tenantDomain.value =
                normalizeDomain(
                    elements.tenantDomain.value
                );
        }
    );

    elements.generateButton.addEventListener(
        "click",
        generateRequest
    );

    elements.initializeGoogleButton.addEventListener(
        "click",
        initializeGoogleSignIn
    );

    elements.copyGoogleIdTokenButton.addEventListener(
        "click",
        () => copyText(
            elements.googleIdToken.value,
            "Google ID token"
        )
    );

    elements.copyCaptchaTokenButton.addEventListener(
        "click",
        () => copyText(
            elements.captchaTokenOutput.value,
            "reCAPTCHA token"
        )
    );

    elements.copyHeadersButton.addEventListener(
        "click",
        () => copyText(
            elements.headersOutput.value,
            "headers"
        )
    );

    elements.copyBodyButton.addEventListener(
        "click",
        () => copyText(
            elements.bodyOutput.value,
            "JSON body"
        )
    );
}

/* ==========================================================================
 * Classic reCAPTCHA initialization
 * ========================================================================== */

async function initializeCaptcha() {

    const response =
        await fetch(
            CAPTCHA_SITE_KEY_ENDPOINT,
            {
                method: "GET",

                headers: {
                    Accept: "application/json"
                },

                cache: "no-store",

                credentials: "same-origin"
            }
        );

    if (!response.ok) {

        throw new Error(
            "Unable to load CAPTCHA site key. HTTP "
            + response.status
        );
    }

    const payload =
        await response.json();

    const siteKey =
        String(
            payload?.siteKey ?? ""
        ).trim();

    if (!siteKey) {

        throw new Error(
            "The backend returned an empty CAPTCHA site key."
        );
    }

    loadedSiteKey =
        siteKey;

    elements.siteKey.value =
        siteKey;

    await loadClassicCaptchaScript(
        siteKey
    );

    await waitForCaptchaReady();
}

/* ==========================================================================
 * Dynamic classic api.js loading
 * ========================================================================== */

function loadClassicCaptchaScript(
    siteKey
) {

    if (captchaScriptPromise) {
        return captchaScriptPromise;
    }

    captchaScriptPromise =
        new Promise(
            (resolve, reject) => {

                const existing =
                    document.querySelector(
                        "script[data-go-worship-recaptcha]"
                    );

                if (existing) {

                    if (captchaAvailable()) {

                        resolve();
                        return;
                    }

                    existing.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );

                    existing.addEventListener(
                        "error",
                        () => reject(
                            new Error(
                                "Failed to load Google reCAPTCHA api.js."
                            )
                        ),
                        {
                            once: true
                        }
                    );

                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://www.google.com/recaptcha/api.js?render="
                    + encodeURIComponent(siteKey);

                script.async =
                    true;

                script.defer =
                    true;

                script.dataset.goWorshipRecaptcha =
                    "true";

                script.addEventListener(
                    "load",
                    resolve,
                    {
                        once: true
                    }
                );

                script.addEventListener(
                    "error",
                    () => reject(
                        new Error(
                            "Failed to load Google reCAPTCHA api.js."
                        )
                    ),
                    {
                        once: true
                    }
                );

                document.head.appendChild(
                    script
                );
            }
        );

    return captchaScriptPromise;
}

function captchaAvailable() {

    return Boolean(
        window.grecaptcha
        && typeof window.grecaptcha.ready === "function"
        && typeof window.grecaptcha.execute === "function"
    );
}

function waitForCaptchaReady() {

    return new Promise(
        (resolve, reject) => {

            if (!captchaAvailable()) {

                reject(
                    new Error(
                        "Classic reCAPTCHA v3 API is unavailable."
                    )
                );

                return;
            }

            try {

                window.grecaptcha.ready(
                    resolve
                );

            } catch (error) {

                reject(error);
            }
        }
    );
}

/* ==========================================================================
 * Action synchronization
 * ========================================================================== */

function synchronizeAction() {

    const action =
        normalizeAction(
            elements.action.value
        );

    const config =
        ACTION_CONFIG[action];

    elements.action.value =
        action;

    elements.path.value =
        config.path;

    elements.method.value =
        config.method;

    if (
        action !== "LOGIN"
        && elements.flow.value === "google-login"
    ) {

        elements.flow.value =
            "custom-login";
    }

    setVisible(
        elements.loginSection,
        Boolean(config.loginVisible)
    );

    setVisible(
        elements.registrationSection,
        Boolean(config.registrationVisible)
    );

    setVisible(
        elements.firstLoginLinkSection,
        Boolean(config.firstLoginLinkVisible)
    );

    setVisible(
        elements.firstLoginPasswordSection,
        Boolean(config.firstLoginPasswordVisible)
    );

    setVisible(
        elements.emailSection,
        Boolean(config.emailVisible)
    );

    setVisible(
        elements.passwordResetSection,
        Boolean(config.passwordResetVisible)
    );

    setVisible(
        elements.otpSection,
        Boolean(config.otpVisible)
    );

    setVisible(
        elements.paymentSection,
        Boolean(config.paymentVisible)
    );

    synchronizeFlow();
    clearOutput();

    setStatus(
        action
        + " configured for "
        + config.method
        + " "
        + config.path,
        "success"
    );
}

function synchronizeFlow() {

    const action =
        normalizeAction(
            elements.action.value
        );

    const googleLogin =
        action === "LOGIN"
        && elements.flow.value === "google-login";

    setVisible(
        elements.googleLoginSection,
        googleLogin
    );

    setVisible(
        elements.loginSection,
        Boolean(ACTION_CONFIG[action].loginVisible)
        && !googleLogin
    );

    elements.path.value =
        googleLogin
            ? "/api/v1/auth/google"
            : ACTION_CONFIG[action].path;

    clearOutput();
}

function setVisible(
    element,
    visible
) {

    element.classList.toggle(
        "hidden",
        !visible
    );
}

/* ==========================================================================
 * Request generation
 * ========================================================================== */

async function generateRequest() {

    clearOutput();

    const validation =
        validateRequest();

    if (!validation.valid) {

        setStatus(
            validation.message,
            "error"
        );

        validation.element?.focus?.();

        return;
    }

    if (!loadedSiteKey) {

        setStatus(
            "CAPTCHA site key has not been loaded.",
            "error"
        );

        return;
    }

    if (!captchaAvailable()) {

        setStatus(
            "Classic reCAPTCHA v3 API is not available.",
            "error"
        );

        return;
    }

    elements.generateButton.disabled =
        true;

    const action =
        normalizeAction(
            elements.action.value
        );

    try {

        await waitForCaptchaReady();

        /*
         * CLASSIC reCAPTCHA v3.
         *
         * Do NOT replace this with:
         *
         * grecaptcha.enterprise.execute(...)
         */
        const token =
            await window.grecaptcha.execute(
                loadedSiteKey,
                {
                    action: action
                }
            );

        if (
            typeof token !== "string"
            || !token.trim()
        ) {

            throw new Error(
                "Google returned an empty reCAPTCHA token."
            );
        }

        /*
         * One timestamp and one nonce are generated for this request.
         *
         * X-Captcha-Ts and X-Captcha-Nonce use these same values.
         *
         * LOGIN currently also receives them in its request body to
         * preserve compatibility with the existing login contract.
         */
        const timestamp =
            Date.now();

        const nonce =
            secureRandomHex(
                DEFAULT_NONCE_BYTE_LENGTH
            );

        const correlationId =
            generateCorrelationId();

        const headers =
            buildHeaders({
                token:
                    token.trim(),

                action,
                timestamp,
                nonce,
                correlationId,

                tenantDomain:
                elements.tenantDomain.value
            });

        const body =
            buildBody({
                action,
                timestamp,
                nonce
            });

        lastToken =
            token.trim();

        lastHeaders =
            Object.freeze({
                ...headers
            });

        lastBody =
            Object.freeze({
                ...body
            });

        renderOutput(
            lastToken,
            headers,
            body
        );

        setStatus(
            "Fresh Classic reCAPTCHA v3 token generated successfully. "
            + "Send the request immediately and do not reuse the token.",
            "success"
        );

    } catch (error) {

        console.error(
            "reCAPTCHA request generation failed",
            error
        );

        setStatus(
            "Generation failed: "
            + errorMessage(error),
            "error"
        );

    } finally {

        elements.generateButton.disabled =
            false;
    }
}

/* ==========================================================================
 * Header generation
 * ========================================================================== */

function buildHeaders({
                          token,
                          action,
                          timestamp,
                          nonce,
                          correlationId,
                          tenantDomain
                      }) {

    const headers = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

        "X-Correlation-Id":
        correlationId,

        "X-Captcha-Token":
        token,

        "X-Captcha-Action":
        action,

        "X-Captcha-Ts":
            String(timestamp),

        "X-Captcha-Nonce":
        nonce
    };

    const domain =
        normalizeDomain(
            tenantDomain
        );

    /*
     * X-Tenant-Domain is deliberately optional.
     *
     * Direct SYSTEM_OWNER:
     *   admin.go-worship.com
     *
     * Direct tenant:
     *   admin.cac.go-worship.com
     *
     * No header required because Host identifies the tenant.
     *
     * Central API:
     *   api.go-worship.com
     *
     * Tenant request should provide X-Tenant-Domain.
     */
    if (domain) {

        headers["X-Tenant-Domain"] =
            domain;
    }

    return headers;
}

/* ==========================================================================
 * Body generation
 * ========================================================================== */

function buildBody({
                       action,
                       timestamp,
                       nonce
                   }) {

    if (
        action === "LOGIN"
        && elements.flow.value === "google-login"
    ) {

        return compactObject({

            idToken:
                elements.googleIdToken.value.trim(),

            timestamp,
            nonce,

            proof:
                elements.proof.value.trim()
        });
    }

    return switchBody(
        ACTION_CONFIG[action].bodyType,
        timestamp,
        nonce
    );
}

function switchBody(
    bodyType,
    timestamp,
    nonce
) {

    switch (bodyType) {

        /* ============================================================= */
        /* Login                                                         */
        /* ============================================================= */

        case "LOGIN":

            return compactObject({

                username:
                    elements.username.value.trim(),

                password:
                elements.password.value,

                timestamp,
                nonce,

                rememberMe:
                elements.rememberMe.checked,

                proof:
                    elements.proof.value.trim()
            });

        /* ============================================================= */
        /* Registration                                                  */
        /* ============================================================= */

        case "REGISTER":

            return compactObject({

                firstName:
                    elements.firstName.value.trim(),

                lastName:
                    elements.lastName.value.trim(),

                username:
                    elements.username.value.trim(),

                email:
                    elements.registrationEmail.value.trim(),

                password:
                elements.password.value,

                confirmPassword:
                elements.confirmPassword.value,

                timestamp,
                nonce,

                proof:
                    elements.proof.value.trim()
            });

        /* ============================================================= */
        /* First-login link                                              */
        /* ============================================================= */

        case "FIRST_LOGIN_LINK":

            /*
             * FirstLoginLinkController.ConsumeRequest:
             *
             * public record ConsumeRequest(
             *     @NotBlank String token
             * ) {}
             */

            return {

                token:
                    elements.firstLoginToken.value.trim()
            };

        /* ============================================================= */
        /* First-login password                                          */
        /* ============================================================= */

        case "FIRST_LOGIN_PASSWORD":

            /*
             * FirstLoginPasswordController.CompleteRequest:
             *
             * challengeToken
             * newPassword
             * confirmPassword
             * rememberMe
             */

            return {

                challengeToken:
                    elements.challengeToken.value.trim(),

                newPassword:
                elements.newPassword.value,

                confirmPassword:
                elements.confirmNewPassword.value,

                rememberMe:
                elements.firstLoginRememberMe.checked
            };

        /* ============================================================= */
        /* Password recovery                                             */
        /* ============================================================= */

        case "FORGOT_PASSWORD": {

            const resetToken =
                elements.passwordResetToken.value.trim();

            const newPassword =
                elements.passwordResetNewPassword.value;

            /*
             * If resetToken exists, prepare reset-password completion.
             */
            if (resetToken) {

                elements.path.value =
                    "/api/v1/auth/reset-password";

                return compactObject({

                    token:
                    resetToken,

                    newPassword:
                    newPassword
                });
            }

            /*
             * Otherwise prepare forgot-password request.
             */
            elements.path.value =
                "/api/v1/auth/forgot-password";

            return {

                email:
                    elements.email.value.trim()
            };
        }

        /* ============================================================= */
        /* OTP send                                                      */
        /* ============================================================= */

        case "OTP_SEND":

            /*
             * GuestOtpController.StartOtpRequest:
             *
             * email
             */

            return {

                email:
                    elements.email.value.trim()
            };

        /* ============================================================= */
        /* OTP verify                                                    */
        /* ============================================================= */

        case "OTP_VERIFY":

            /*
             * GuestOtpController.VerifyOtpRequest:
             *
             * email
             * otp
             */

            return {

                email:
                    elements.email.value.trim(),

                otp:
                    elements.otp.value.trim()
            };

        /* ============================================================= */
        /* Checkout                                                      */
        /* ============================================================= */

        case "CHECKOUT":

            return compactObject({

                customerEmail:
                    elements.customerEmail.value.trim(),

                amount:
                    normalizedAmount(
                        elements.amount.value
                    ),

                currency:
                    elements.currency.value
                        .trim()
                        .toUpperCase(),

                checkoutReference:
                    elements.reference.value.trim(),

                timestamp,
                nonce,

                proof:
                    elements.proof.value.trim()
            });

        /* ============================================================= */
        /* Payment                                                       */
        /* ============================================================= */

        case "PAYMENT":

            return compactObject({

                customerEmail:
                    elements.customerEmail.value.trim(),

                amount:
                    normalizedAmount(
                        elements.amount.value
                    ),

                currency:
                    elements.currency.value
                        .trim()
                        .toUpperCase(),

                paymentReference:
                    elements.reference.value.trim(),

                timestamp,
                nonce,

                proof:
                    elements.proof.value.trim()
            });

        default:

            throw new Error(
                "Unsupported body type: "
                + bodyType
            );
    }
}

/* ==========================================================================
 * Validation
 * ========================================================================== */

function validateRequest() {

    const action =
        normalizeAction(
            elements.action.value
        );

    /*
     * Google login.
     */
    if (
        action === "LOGIN"
        && elements.flow.value === "google-login"
    ) {

        return elements.googleIdToken.value.trim()
            ? valid()
            : invalid(
                "Generate a Google ID token first.",
                elements.initializeGoogleButton
            );
    }

    switch (ACTION_CONFIG[action].bodyType) {

        case "LOGIN":

            if (!elements.username.value.trim()) {

                return invalid(
                    "Username or email is required.",
                    elements.username
                );
            }

            if (!elements.password.value) {

                return invalid(
                    "Password is required.",
                    elements.password
                );
            }

            return valid();

        case "REGISTER":

            if (!elements.firstName.value.trim()) {

                return invalid(
                    "First name is required.",
                    elements.firstName
                );
            }

            if (!elements.lastName.value.trim()) {

                return invalid(
                    "Last name is required.",
                    elements.lastName
                );
            }

            if (
                !validEmail(
                    elements.registrationEmail.value
                )
            ) {

                return invalid(
                    "A valid registration email is required.",
                    elements.registrationEmail
                );
            }

            if (!elements.password.value) {

                return invalid(
                    "Password is required.",
                    elements.password
                );
            }

            if (
                elements.password.value
                !== elements.confirmPassword.value
            ) {

                return invalid(
                    "Password confirmation does not match.",
                    elements.confirmPassword
                );
            }

            return valid();

        case "FIRST_LOGIN_LINK":

            return elements.firstLoginToken.value.trim()
                ? valid()
                : invalid(
                    "First-login link token is required.",
                    elements.firstLoginToken
                );

        case "FIRST_LOGIN_PASSWORD":

            if (!elements.challengeToken.value.trim()) {

                return invalid(
                    "Challenge token is required.",
                    elements.challengeToken
                );
            }

            if (!elements.newPassword.value) {

                return invalid(
                    "New password is required.",
                    elements.newPassword
                );
            }

            if (
                elements.newPassword.value
                !== elements.confirmNewPassword.value
            ) {

                return invalid(
                    "New password confirmation does not match.",
                    elements.confirmNewPassword
                );
            }

            return valid();

        case "FORGOT_PASSWORD":

            if (
                elements.passwordResetToken.value.trim()
            ) {

                return elements.passwordResetNewPassword.value
                    ? valid()
                    : invalid(
                        "New password is required.",
                        elements.passwordResetNewPassword
                    );
            }

            return validEmail(
                elements.email.value
            )
                ? valid()
                : invalid(
                    "A valid email address is required.",
                    elements.email
                );

        case "OTP_SEND":

            return validEmail(
                elements.email.value
            )
                ? valid()
                : invalid(
                    "A valid email address is required.",
                    elements.email
                );

        case "OTP_VERIFY":

            if (
                !validEmail(
                    elements.email.value
                )
            ) {

                return invalid(
                    "A valid email address is required.",
                    elements.email
                );
            }

            return elements.otp.value.trim()
                ? valid()
                : invalid(
                    "OTP code is required.",
                    elements.otp
                );

        case "CHECKOUT":
        case "PAYMENT":

            if (
                !validEmail(
                    elements.customerEmail.value
                )
            ) {

                return invalid(
                    "A valid customer email is required.",
                    elements.customerEmail
                );
            }

            if (
                !Number.isFinite(
                    Number(
                        elements.amount.value
                    )
                )
                || Number(
                    elements.amount.value
                ) <= 0
            ) {

                return invalid(
                    "Amount must be greater than zero.",
                    elements.amount
                );
            }

            if (
                !/^[A-Z]{3}$/.test(
                    elements.currency.value
                        .trim()
                        .toUpperCase()
                )
            ) {

                return invalid(
                    "Currency must be a three-letter ISO code.",
                    elements.currency
                );
            }

            return valid();

        default:

            return invalid(
                "Unsupported action.",
                elements.action
            );
    }
}

function valid() {

    return Object.freeze({
        valid: true,
        message: "",
        element: null
    });
}

function invalid(
    message,
    element
) {

    return Object.freeze({
        valid: false,
        message,
        element
    });
}

/* ==========================================================================
 * Google Sign-In
 * ========================================================================== */

function initializeGoogleSignIn() {

    if (
        elements.action.value !== "LOGIN"
        || elements.flow.value !== "google-login"
    ) {

        setStatus(
            "Select LOGIN and Google Login first.",
            "error"
        );

        return;
    }

    const clientId =
        elements.googleClientId.value.trim();

    if (!clientId) {

        setStatus(
            "Google Client ID is required.",
            "error"
        );

        return;
    }

    if (
        !window.google
        || !window.google.accounts
        || !window.google.accounts.id
    ) {

        setStatus(
            "Google Identity Services has not loaded.",
            "error"
        );

        return;
    }

    elements.googleButton.innerHTML =
        "";

    window.google.accounts.id.initialize({

        client_id:
        clientId,

        callback:
            response => {

                if (!response?.credential) {

                    setStatus(
                        "Google did not return an ID token.",
                        "error"
                    );

                    return;
                }

                elements.googleIdToken.value =
                    response.credential;

                setStatus(
                    "Google ID token generated.",
                    "success"
                );
            },

        auto_select:
            false,

        cancel_on_tap_outside:
            true
    });

    window.google.accounts.id.renderButton(
        elements.googleButton,
        {
            type:
                "standard",

            theme:
                "outline",

            size:
                "large",

            text:
                "signin_with",

            shape:
                "rectangular",

            logo_alignment:
                "left",

            width:
                320
        }
    );
}

/* ==========================================================================
 * Secure random values
 * ========================================================================== */

function secureRandomHex(
    byteLength
) {

    if (
        !window.crypto
        || typeof window.crypto.getRandomValues !== "function"
    ) {

        throw new Error(
            "Secure browser random generation is unavailable."
        );
    }

    const bytes =
        new Uint8Array(
            byteLength
        );

    window.crypto.getRandomValues(
        bytes
    );

    return Array.from(bytes)
        .map(
            value =>
                value
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}

function generateCorrelationId() {

    if (
        window.crypto
        && typeof window.crypto.randomUUID === "function"
    ) {

        return window.crypto.randomUUID();
    }

    return secureRandomHex(
        16
    );
}

/* ==========================================================================
 * Normalization
 * ========================================================================== */

function normalizeAction(
    value
) {

    const normalized =
        String(
            value ?? ""
        )
            .trim()
            .toUpperCase();

    return Object.hasOwn(
        ACTION_CONFIG,
        normalized
    )
        ? normalized
        : "LOGIN";
}

function normalizeDomain(
    value
) {

    let normalized =
        String(
            value ?? ""
        )
            .trim()
            .toLowerCase();

    if (!normalized) {
        return "";
    }

    normalized =
        normalized.replace(
            /^https?:\/\//,
            ""
        );

    normalized =
        normalized.split(
            "/"
        )[0];

    normalized =
        normalized.replace(
            /:\d+$/,
            ""
        );

    normalized =
        normalized.replace(
            /\.$/,
            ""
        );

    return normalized;
}

function normalizeCurrency() {

    elements.currency.value =
        elements.currency.value
            .trim()
            .toUpperCase()
            .replace(
                /[^A-Z]/g,
                ""
            )
            .substring(
                0,
                3
            );
}

function normalizedAmount(
    value
) {

    const amount =
        Number(value);

    if (
        !Number.isFinite(amount)
        || amount <= 0
    ) {

        throw new Error(
            "Amount must be greater than zero."
        );
    }

    return Number(
        amount.toFixed(2)
    );
}

function validEmail(
    value
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(
            value ?? ""
        ).trim()
    );
}

function compactObject(
    source
) {

    return Object.fromEntries(
        Object.entries(
            source
        )
            .filter(
                ([, value]) => {

                    if (value == null) {
                        return false;
                    }

                    if (
                        typeof value === "string"
                        && !value.trim()
                    ) {
                        return false;
                    }

                    return true;
                }
            )
    );
}

/* ==========================================================================
 * Output
 * ========================================================================== */

function renderOutput(
    token,
    headers,
    body
) {

    elements.captchaTokenOutput.value =
        token;

    elements.requestUrlOutput.value =
        elements.method.value
        + " "
        + elements.path.value;

    elements.headersOutput.value =
        Object.entries(
            headers
        )
            .map(
                ([name, value]) =>
                    name
                    + ": "
                    + value
            )
            .join(
                "\n"
            );

    elements.bodyOutput.value =
        JSON.stringify(
            body,
            null,
            2
        );
}

function clearOutput() {

    lastToken =
        "";

    lastHeaders =
        {};

    lastBody =
        {};

    if (!elements.captchaTokenOutput) {
        return;
    }

    elements.captchaTokenOutput.value =
        "";

    elements.requestUrlOutput.value =
        "";

    elements.headersOutput.value =
        "";

    elements.bodyOutput.value =
        "";
}

/* ==========================================================================
 * Status
 * ========================================================================== */

function setStatus(
    message,
    type = ""
) {

    elements.status.textContent =
        message ?? "";

    elements.status.className =
        type
            ? "status " + type
            : "status";
}

/* ==========================================================================
 * Clipboard
 * ========================================================================== */

async function copyText(
    value,
    description
) {

    if (
        !String(
            value ?? ""
        ).trim()
    ) {

        setStatus(
            "There is no "
            + description
            + " to copy.",
            "error"
        );

        return;
    }

    try {

        if (
            navigator.clipboard
            && typeof navigator.clipboard.writeText === "function"
        ) {

            await navigator.clipboard.writeText(
                value
            );

        } else {

            fallbackCopy(
                value
            );
        }

        setStatus(
            description
            + " copied.",
            "success"
        );

    } catch (error) {

        console.error(
            "Clipboard operation failed",
            error
        );

        setStatus(
            "Copy failed. Copy the value manually.",
            "error"
        );
    }
}

function fallbackCopy(
    value
) {

    const temporary =
        document.createElement(
            "textarea"
        );

    temporary.value =
        value;

    temporary.setAttribute(
        "readonly",
        ""
    );

    temporary.style.position =
        "fixed";

    temporary.style.opacity =
        "0";

    document.body.appendChild(
        temporary
    );

    temporary.select();

    document.execCommand(
        "copy"
    );

    document.body.removeChild(
        temporary
    );
}

/* ==========================================================================
 * Error helper
 * ========================================================================== */

function errorMessage(
    error
) {

    if (
        error
        && typeof error.message === "string"
        && error.message.trim()
    ) {

        return error.message.trim();
    }

    return String(
        error ?? "Unknown error"
    );
}

/* ==========================================================================
 * Development helper
 * ========================================================================== */

window.GoWorshipCaptchaTool =
    Object.freeze({

        getToken() {

            return lastToken;
        },

        getHeaders() {

            return {
                ...lastHeaders
            };
        },

        getBody() {

            return {
                ...lastBody
            };
        },

        getSiteKey() {

            return loadedSiteKey;
        },

        getAction() {

            return normalizeAction(
                elements.action.value
            );
        },

        clear() {

            clearOutput();

            setStatus(
                "Generated values cleared.",
                "success"
            );
        }
    });