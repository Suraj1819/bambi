package com.webdrop.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.OutputStream;

@CapacitorPlugin(name = "FileSaver")
public class FileSaverPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {

        String fileName = call.getString("fileName");

        String mimeType = call.getString(
            "mimeType",
            "application/octet-stream"
        );

        String base64 = call.getString("base64");

        if (fileName == null || fileName.isEmpty()) {
            call.reject("File name is required");
            return;
        }

        if (base64 == null || base64.isEmpty()) {
            call.reject("File data is required");
            return;
        }

        // Keep file data until Android Save As picker returns
        call.getData().put("base64", base64);

        Intent intent = new Intent(
            Intent.ACTION_CREATE_DOCUMENT
        );

        intent.addCategory(
            Intent.CATEGORY_OPENABLE
        );

        intent.setType(mimeType);

        intent.putExtra(
            Intent.EXTRA_TITLE,
            fileName
        );

        startActivityForResult(
            call,
            intent,
            "handleCreateDocument"
        );
    }

    @ActivityCallback
    private void handleCreateDocument(
        PluginCall call,
        ActivityResult result
    ) {

        if (
            result.getResultCode()
                != Activity.RESULT_OK
        ) {
            call.reject("Save cancelled");
            return;
        }

        Intent data = result.getData();

        if (data == null) {
            call.reject(
                "No file location selected"
            );
            return;
        }

        Uri uri = data.getData();

        if (uri == null) {
            call.reject(
                "Invalid file location"
            );
            return;
        }

        try {

            String base64 =
                call.getData()
                    .getString("base64");

            if (
                base64 == null
                || base64.isEmpty()
            ) {
                call.reject(
                    "File data is missing"
                );
                return;
            }

            byte[] fileBytes =
                Base64.decode(
                    base64,
                    Base64.DEFAULT
                );

            OutputStream outputStream =
                getContext()
                    .getContentResolver()
                    .openOutputStream(uri);

            if (outputStream == null) {
                call.reject(
                    "Unable to open selected location"
                );
                return;
            }

            outputStream.write(fileBytes);
            outputStream.flush();
            outputStream.close();

            JSObject resultObject =
                new JSObject();

            resultObject.put(
                "success",
                true
            );

            resultObject.put(
                "uri",
                uri.toString()
            );

            call.resolve(resultObject);

        } catch (Exception error) {

            call.reject(
                "Failed to save file: "
                    + error.getMessage()
            );
        }
    }
}