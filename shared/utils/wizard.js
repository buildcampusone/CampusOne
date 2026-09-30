let currentStep = 1;
const TOTAL_STEPS = 6;

export function initWizard() {

    bindEvents();

    renderWizard();

}

function bindEvents() {

    document.addEventListener("click", (event) => {

        if (event.target.closest("#riNextStep1")) {

            nextStep();

        }

        if (event.target.closest("#nextStep2")) {

            nextStep();

        }

        if (event.target.closest("#backStep2")) {

            previousStep();

        }

    });

}

function nextStep() {

    if (currentStep < TOTAL_STEPS) {

        currentStep++;

        renderWizard();

    }

}

function previousStep() {

    if (currentStep > 1) {

        currentStep--;

        renderWizard();

    }

}

function renderWizard() {

    document.querySelectorAll(".ri-panel").forEach(panel => {

        panel.classList.remove("active");

    });

    document.querySelector(`.ri-panel[data-panel="${currentStep}"]`)?.classList.add("active");

    document.querySelectorAll(".ri-step").forEach((step, index) => {

        step.classList.remove("active", "completed");

        if (index + 1 < currentStep) {

            step.classList.add("completed");

        } else if (index + 1 === currentStep) {

            step.classList.add("active");

        }

    });

}