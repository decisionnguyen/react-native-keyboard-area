package com.rn.keyboard

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Rect
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewTreeObserver
import android.view.WindowManager
import android.widget.PopupWindow

object KeyboardInfo {
    const val HEIGHT_NOT_COMPUTED = -1
    const val STATE_UNKNOWN = -1
    const val STATE_CLOSED = 0
    const val STATE_OPENED = 1

    /**
     * Cached keyboard height. This will keep the last keyboard height value and not
     * it's current height
     */
    var keyboardHeight = HEIGHT_NOT_COMPUTED

    /**
     * Real time keyboard state
     */
    var keyboardState = STATE_UNKNOWN
}

class KeyboardProvider(private val activity: Activity) : PopupWindow(activity) {

    private var heightMax = 0;
    private var lastKeyboardHeight = -1
    private var resizableView: View
    private var parentView: View? = null
    private var keyboardListener:KeyboardListener? = null
    private var lastLandscape = false; // check last is landscape
    private var bottomBarHeight = 0; // check bottom bar height in galaxy fold 3 or samsung device error

    init {
        contentView = View.inflate(activity, R.layout.keyboard_popup, null)
        resizableView = contentView.findViewById(R.id.keyResizeContainer)
        softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or
                WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE
        inputMethodMode = PopupWindow.INPUT_METHOD_NEEDED

        width = 0
        height = WindowManager.LayoutParams.MATCH_PARENT

        parentView = activity.window.decorView.rootView
        parentView?.post {
            Log.e("addKeyboardListener", "add");
            resizableView.viewTreeObserver.addOnGlobalLayoutListener(getGlobalLayoutListener())
            if (!isShowing && parentView?.windowToken != null) {
                showAtLocation(parentView, Gravity.NO_GRAVITY, 0, 0)
            }
        }
    }

    fun addKeyboardListener(listener: KeyboardListener) {
        keyboardListener = listener
        return
    }

    fun removeKeyboardListener() {
        keyboardListener = null
    }

    private fun getGlobalLayoutListener() = ViewTreeObserver.OnGlobalLayoutListener {
        val rect = Rect()
        contentView.rootView.getWindowVisibleDisplayFrame(rect)
        val orientation = activity.resources.configuration.orientation;

        // can tinh lai max height cua view khi ma rotate
        val isCurrentLandscape = orientation == Configuration.ORIENTATION_LANDSCAPE;

        if (lastLandscape != isCurrentLandscape) {
            heightMax = 0;
            lastLandscape = isCurrentLandscape
        }
        // tinh lai heightMax neu ko se bi loi khi rotate from landscape to portrait

        if (rect.bottom > heightMax) {
            heightMax = rect.bottom;
        }

        var keyboardHeight = heightMax - rect.bottom

        Log.e("KeyboardHeightProvider", "maxHeight " + heightMax + " rect = " + rect.bottom + " keyboardHeight = " + keyboardHeight);

        if (keyboardHeight < 100) {
            bottomBarHeight = keyboardHeight;
            keyboardHeight = 0;
        } else {
            bottomBarHeight = 0;
        }

        if (keyboardHeight > 0) {
            KeyboardInfo.keyboardHeight = keyboardHeight
            KeyboardInfo.keyboardState = KeyboardInfo.STATE_OPENED
        } else {
            KeyboardInfo.keyboardState = KeyboardInfo.STATE_CLOSED
        }

        if (keyboardHeight != lastKeyboardHeight) {
            notifyKeyboardHeightChanged(keyboardHeight - bottomBarHeight, orientation)
        }
        lastKeyboardHeight = keyboardHeight - bottomBarHeight
    }



    private fun notifyKeyboardHeightChanged(height: Int, orientation: Int) {
        keyboardListener?.onHeightChanged(height)
    }

    interface KeyboardListener {
        fun onHeightChanged(height: Int)
    }
}
