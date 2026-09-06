Dropzone.autoDiscover = false;


function formatName(name) {

    return name
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });

}


function init() {

    let dz = new Dropzone("#dropzone", {

        url: "/",
        maxFiles: 1,
        addRemoveLinks: true,

        dictDefaultMessage:
            "Drop your image here or click to upload",

        autoProcessQueue: false

    });


    // Allow only one image
    dz.on("addedfile", function () {

        if (dz.files.length > 1) {
            dz.removeFile(dz.files[0]);
        }

        $("#error").hide();

    });


    // Classify image
    $("#submitBtn").on("click", function (e) {

        e.preventDefault();


        if (dz.files.length === 0) {

            $("#error")
                .text("Please upload an image first.")
                .show();

            return;
        }


        let imageData = dz.files[0].dataURL;


        $("#submitBtn")
            .prop("disabled", true)
            .text("Classifying...");


        $.post(

            "http://127.0.0.1:5000/classify_image",

            {
                image_data: imageData
            },

            function (data) {

                console.log("Model response:", data);


                if (!data || data.length === 0) {

                    $("#error")
                        .text("Could not classify this image.")
                        .show();

                    return;
                }


                /*
                 * Find the prediction with the highest probability
                 */

                let match = null;
                let bestScore = -1;


                for (let i = 0; i < data.length; i++) {

                    let probabilities =
                        data[i].class_probability;

                    let maxScore =
                        Math.max(...probabilities);


                    if (maxScore > bestScore) {

                        bestScore = maxScore;
                        match = data[i];

                    }

                }


                if (!match) {

                    $("#error")
                        .text("No prediction was returned.")
                        .show();

                    return;

                }


                console.log("Predicted class:", match.class);
                console.log("Best score:", bestScore);


                $("#error").hide();


                /*
                 * Prediction
                 */

                let predictionName =
                    formatName(match.class);


                $("#resultHolder").html(`

                    <div class="prediction-card">

                        <div class="prediction-label">
                            PREDICTION
                        </div>

                        <h2>${predictionName}</h2>

                        <div class="confidence">
                            Confidence:
                            <strong>
                                ${(bestScore * 100).toFixed(2)}%
                            </strong>
                        </div>

                    </div>

                `);


                /*
                 * Probability list
                 */

                let probabilityHTML = "";


                let classDictionary =
                    match.class_dictionary;


                for (let personName in classDictionary) {

                    let index =
                        classDictionary[personName];


                    let probability =
                        match.class_probability[index];


                    let percentage = probability;


                    let displayName =
                        formatName(personName);


                    probabilityHTML += `

                        <div class="probability-item">

                            <div class="probability-header">

                                <span>
                                    ${displayName}
                                </span>

                                <span>
                                    ${percentage.toFixed(2)}%
                                </span>

                            </div>


                            <div class="progress-bar">

                                <div
                                    class="progress"
                                    style="width: ${percentage}%">
                                </div>

                            </div>

                        </div>

                    `;

                }


                $("#probabilityList")
                    .html(probabilityHTML);


                $("#divClassTable").show();


                /*
                 * Highlight predicted celebrity
                 */

                $(".celebrity-card").removeClass("predicted");


                $(".celebrity-card").each(function () {

                    let cardName =
                        $(this)
                            .find("h3")
                            .text()
                            .toLowerCase()
                            .replace(/ /g, "_");


                    let predictedName =
                        match.class.toLowerCase();


                    if (cardName === predictedName) {

                        $(this).addClass("predicted");

                    }

                });


            }

        ).fail(function (xhr) {

            console.error(
                "Classification request failed:",
                xhr
            );


            $("#error")
                .text(
                    "Classification failed. Make sure the Flask server is running."
                )
                .show();


            $("#resultHolder").hide();
            $("#divClassTable").hide();

        }).always(function () {

            $("#submitBtn")
                .prop("disabled", false)
                .text("Classify Image");

        });

    });

}


$(document).ready(function () {

    console.log("Client ready!");

    $("#error").hide();
    $("#resultHolder").hide();
    $("#divClassTable").hide();

    init();

});